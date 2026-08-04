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
	"gooffer/backend/internal/config"
	"gooffer/backend/internal/repository/postgres"
	"gooffer/backend/internal/server"
	"gooffer/backend/internal/usecase/auth"
	"gooffer/backend/internal/usecase/generator"
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

	userRepository := postgres.NewUserRepository(database)
	authRepository := postgres.NewAuthRepository(database)
	actionRepository := postgres.NewActionRepository(database)
	recapRepository := postgres.NewRecapRepository(database)
	profileService := profile.New(logger, userRepository)
	authService := auth.New(authRepository, cfg.SessionTTL)
	recapGenerator := generator.New(
		userRepository,
		actionRepository,
		recapRepository,
	)

	httpServer := server.New(cfg.HTTPAddress(), server.Dependencies{
		Auth:           authService,
		Profiles:       profileService,
		RecapGenerator: recapGenerator,
		Recaps:         recapRepository,
	}, server.Options{
		Logger:         logger,
		AllowedOrigins: cfg.AllowedOrigins,
		ReadTimeout:    cfg.ReadTimeout,
		WriteTimeout:   cfg.WriteTimeout,
		IdleTimeout:    cfg.IdleTimeout,
		CookieSecure:   cfg.CookieSecure,
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
