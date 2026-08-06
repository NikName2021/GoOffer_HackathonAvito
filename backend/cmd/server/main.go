package main

import (
	"context"
	"errors"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gooffer/backend/internal/config"
	"gooffer/backend/internal/delivery/handlers"
	"gooffer/backend/internal/repository/postgres"
	redisrepo "gooffer/backend/internal/repository/redis"
	"gooffer/backend/internal/server"
	"gooffer/backend/internal/usecase/auth"
	"gooffer/backend/internal/usecase/generator"
	"gooffer/backend/internal/usecase/ports"
	"gooffer/backend/internal/usecase/profile"
	"gooffer/backend/migrations"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	cfg := config.Load()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	pool, err := pgxpool.New(ctx, cfg.PostgresDSN())
	if err != nil {
		log.Fatalf("connect postgres: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("ping postgres: %v", err)
	}
	logger.Info("postgres connected")

	if err := migrations.Apply(ctx, pool); err != nil {
		log.Fatalf("migrations: %v", err)
	}
	logger.Info("migrations applied")

	var cache ports.Cache
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisHost + ":" + cfg.RedisPort,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})
	if err := rdb.Ping(ctx).Err(); err != nil {
		logger.Warn("redis unavailable, cache disabled", slog.String("error", err.Error()))
		_ = rdb.Close()
		cache = redisrepo.NewNoopCache()
	} else {
		logger.Info("redis connected")
		cache = redisrepo.NewRecapCache(rdb)
		defer func() { _ = rdb.Close() }()
	}

	userRepo := postgres.NewUserRepository(pool)
	actionRepo := postgres.NewActionRepository(pool)
	recapRepo := postgres.NewRecapRepository(pool)
	accountRepo := postgres.NewAccountRepository(pool)
	sessionRepo := postgres.NewSessionRepository(pool)

	profileService := profile.New(logger, userRepo)
	gen := generator.New(logger, userRepo, actionRepo, recapRepo, cache)
	authService := auth.New(accountRepo, sessionRepo)

	profileHandler := handlers.NewProfileHandler(logger, profileService)
	recapHandler := handlers.NewRecapHandler(logger, gen)
	authHandler := handlers.NewAuthHandler(logger, authService, cfg.CookieSecure)

	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.ServerPort
	}

	srv := server.New(server.Dependencies{
		Logger:         logger,
		Addr:           ":" + port,
		ProfileHandler: profileHandler,
		RecapHandler:   recapHandler,
		AuthHandler:    authHandler,
		AuthService:    authService,
	})

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := srv.Shutdown(shutdownCtx); err != nil {
			logger.Error("server shutdown", slog.String("error", err.Error()))
		}
	}()

	logger.Info("backend is listening", slog.String("port", port))
	if err := srv.Start(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("server stopped: %v", err)
	}
}
