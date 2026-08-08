package server

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"gooffer/backend/docs"
	"gooffer/backend/internal/delivery/handlers"
	"gooffer/backend/internal/delivery/middleware"
)

type Dependencies struct {
	Auth           handlers.AuthService
	Profiles       handlers.ProfileService
	RecapGenerator handlers.RecapGenerator
	Recaps         handlers.RecapReader
}

type Options struct {
	Logger           *slog.Logger
	AllowedOrigins   []string
	ReadTimeout      time.Duration
	WriteTimeout     time.Duration
	IdleTimeout      time.Duration
	CookieSecure     bool
	MetricCollectors []prometheus.Collector
}

func New(address string, dependencies Dependencies, options Options) *http.Server {
	readTimeout := options.ReadTimeout
	if readTimeout == 0 {
		readTimeout = 10 * time.Second
	}
	writeTimeout := options.WriteTimeout
	if writeTimeout == 0 {
		writeTimeout = 20 * time.Second
	}
	idleTimeout := options.IdleTimeout
	if idleTimeout == 0 {
		idleTimeout = 60 * time.Second
	}

	return &http.Server{
		Addr:              address,
		Handler:           NewRouter(dependencies, options),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       readTimeout,
		WriteTimeout:      writeTimeout,
		IdleTimeout:       idleTimeout,
	}
}

func NewRouter(dependencies Dependencies, options Options) http.Handler {
	logger := options.Logger
	if logger == nil {
		logger = slog.Default()
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", healthHandler)
	metricsHandler, instrumentHTTP := newMetrics(options.MetricCollectors...)
	mux.Handle("GET /metrics", metricsHandler)
	docs.Register(mux)
	authHandler := handlers.NewAuthHandler(dependencies.Auth, logger, handlers.AuthHandlerOptions{
		CookieName:   "gooffer_session",
		CookieSecure: options.CookieSecure,
	})
	authHandler.RegisterRoutes(mux)

	protectedMux := http.NewServeMux()
	profileHandler := handlers.NewProfileHandler(dependencies.Profiles, logger)
	profileHandler.Register(protectedMux)
	recapHandler := handlers.NewRecapHandler(
		dependencies.RecapGenerator,
		dependencies.Recaps,
		dependencies.Profiles,
		logger,
	)
	recapHandler.Register(protectedMux)
	protectedMux.HandleFunc("/", notFoundHandler)
	protectedHandler := middleware.Authenticate(dependencies.Auth, "gooffer_session", logger)(protectedMux)
	mux.Handle("/api/", protectedHandler)

	mux.HandleFunc("/", notFoundHandler)

	var handler http.Handler = mux
	handler = middleware.CORS(options.AllowedOrigins)(handler)
	handler = middleware.Recovery(logger)(handler)
	handler = middleware.Logger(logger)(handler)
	handler = middleware.RequestID(handler)
	handler = instrumentHTTP(handler)
	return handler
}

func healthHandler(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func notFoundHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusNotFound, map[string]any{
		"error": map[string]string{
			"code":       "not_found",
			"message":    "route not found",
			"request_id": middleware.RequestIDFromContext(r.Context()),
		},
	})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
