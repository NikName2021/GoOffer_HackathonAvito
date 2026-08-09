package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	goredis "github.com/redis/go-redis/v9"
	"gooffer/backend/internal/config"
	"gooffer/backend/internal/observability"
	"gooffer/backend/internal/repository/postgres"
	redisrepo "gooffer/backend/internal/repository/redis"
	"gooffer/backend/internal/server"
	"gooffer/backend/internal/usecase/auth"
	"gooffer/backend/internal/usecase/carddefinition"
	"gooffer/backend/internal/usecase/generator"
	missionusecase "gooffer/backend/internal/usecase/mission"
	"gooffer/backend/internal/usecase/profile"
	"gooffer/backend/migrations"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	if err := run(logger); err != nil {
		logger.Error("application stopped", slog.String("error", err.Error()))
		os.Exit(1)
	}
}

func run(logger *slog.Logger) error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}

	startupCtx, cancelStartup := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancelStartup()

	poolConfig, err := pgxpool.ParseConfig(cfg.DatabaseURL())
	if err != nil {
		return fmt.Errorf("parse database config: %w", err)
	}
	database, err := pgxpool.NewWithConfig(startupCtx, poolConfig)
	if err != nil {
		return fmt.Errorf("connect database: %w", err)
	}
	defer database.Close()
	if err := database.Ping(startupCtx); err != nil {
		return fmt.Errorf("ping database: %w", err)
	}
	if err := migrations.Apply(startupCtx, database); err != nil {
		return fmt.Errorf("apply database migrations: %w", err)
	}

	redisOptions, err := goredis.ParseURL(cfg.RedisURL)
	if err != nil {
		return fmt.Errorf("parse redis config: %w", err)
	}
	redisClient := goredis.NewClient(redisOptions)
	defer func() {
		if err := redisClient.Close(); err != nil {
			logger.Warn("failed to close redis client", slog.String("error", err.Error()))
		}
	}()
	if err := redisClient.Ping(startupCtx).Err(); err != nil {
		logger.Warn("redis unavailable, recap cache will fall back to postgres",
			slog.String("error", err.Error()),
		)
	}

	userRepository := postgres.NewUserRepository(database)
	authRepository := postgres.NewAuthRepository(database)
	recapStore := postgres.NewRecapRepository(database)
	missionRepository := postgres.NewMissionRepository(database)
	cardDefinitionRepository := postgres.NewCardDefinitionRepository(database)
	recapCache := redisrepo.NewRecapCache(redisClient)
	recapCacheMetrics := observability.NewRecapCacheMetrics()
	businessMetrics := observability.NewBusinessMetrics()
	recapRepository := redisrepo.NewCachedRecapRepository(
		recapStore,
		recapCache,
		logger,
		recapCacheMetrics,
	)
	metricCollectors := observability.NewPostgresPoolCollectors(database)
	metricCollectors = append(metricCollectors, recapCacheMetrics.Collectors()...)
	metricCollectors = append(metricCollectors, businessMetrics.Collectors()...)
	profileService := profile.New(logger, userRepository)
	authService := auth.New(authRepository, cfg.SessionTTL)
	adminCardService := carddefinition.New(cardDefinitionRepository)
	recapGenerator := generator.New(
		userRepository,
		recapRepository,
		cardDefinitionRepository,
	)
	missionService := missionusecase.New(userRepository, recapRepository, missionRepository)

	httpServer := server.New(cfg.HTTPAddress(), server.Dependencies{
		Auth:           authService,
		Profiles:       profileService,
		RecapGenerator: recapGenerator,
		Recaps:         recapRepository,
		Missions:       missionService,
		BusinessEvents: businessMetrics,
		AdminCards:     adminCardService,
	}, server.Options{
		Logger:           logger,
		AllowedOrigins:   cfg.AllowedOrigins,
		ReadTimeout:      cfg.ReadTimeout,
		WriteTimeout:     cfg.WriteTimeout,
		IdleTimeout:      cfg.IdleTimeout,
		CookieSecure:     cfg.CookieSecure,
		MetricCollectors: metricCollectors,
	})

	shutdownContext, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	serverErrors := make(chan error, 1)
	go func() {
		logger.Info("backend started", slog.String("address", cfg.HTTPAddress()))
		serverErrors <- httpServer.ListenAndServe()
	}()

	select {
	case err := <-serverErrors:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			return fmt.Errorf("serve HTTP: %w", err)
		}
		return nil
	case <-shutdownContext.Done():
		ctx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
		defer cancel()
		if err := httpServer.Shutdown(ctx); err != nil {
			return fmt.Errorf("shutdown HTTP server: %w", err)
		}
		logger.Info("backend stopped gracefully")
		return nil
	}
}
