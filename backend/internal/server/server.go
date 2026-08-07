package server

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"gooffer/backend/internal/delivery/handlers"
	"gooffer/backend/internal/delivery/middleware"
	"gooffer/backend/internal/usecase/auth"
)

type Server struct {
	httpServer *http.Server
	logger     *slog.Logger
}

type Dependencies struct {
	Logger         *slog.Logger
	Addr           string
	ProfileHandler *handlers.ProfileHandler
	RecapHandler   *handlers.RecapHandler
	AuthHandler    *handlers.AuthHandler
	AuthService    *auth.Service
}

func New(deps Dependencies) *Server {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	if deps.AuthHandler != nil {
		mux.HandleFunc("POST /api/auth/register", deps.AuthHandler.Register)
		mux.HandleFunc("POST /api/auth/login", deps.AuthHandler.Login)
		mux.HandleFunc("POST /api/auth/logout", deps.AuthHandler.Logout)
		mux.HandleFunc("GET /api/auth/me", deps.AuthHandler.Me)
	}

	profileList := http.HandlerFunc(deps.ProfileHandler.List)
	profileGet := http.HandlerFunc(deps.ProfileHandler.GetByID)
	recapGen := http.HandlerFunc(deps.RecapHandler.Generate)
	recapGenAll := http.HandlerFunc(deps.RecapHandler.GenerateAll)
	recapGet := http.HandlerFunc(deps.RecapHandler.Get)
	recapShare := http.HandlerFunc(deps.RecapHandler.Share)

	if middleware.AuthRequiredFromEnv() && deps.AuthService != nil {
		require := middleware.RequireAuth(deps.AuthService, deps.Logger)
		mux.Handle("GET /api/profiles", require(profileList))
		mux.Handle("GET /api/profiles/{id}", require(profileGet))
		mux.Handle("POST /api/recap/generate", require(recapGen))
		mux.Handle("POST /api/recap/generate-all", require(recapGenAll))
		mux.Handle("GET /api/recap/{user_id}/{year}", require(recapGet))
		mux.Handle("GET /api/recap/{user_id}/{year}/share", require(recapShare))
	} else {
		mux.HandleFunc("GET /api/profiles", deps.ProfileHandler.List)
		mux.HandleFunc("GET /api/profiles/{id}", deps.ProfileHandler.GetByID)
		mux.HandleFunc("POST /api/recap/generate", deps.RecapHandler.Generate)
		mux.HandleFunc("POST /api/recap/generate-all", deps.RecapHandler.GenerateAll)
		mux.HandleFunc("GET /api/recap/{user_id}/{year}", deps.RecapHandler.Get)
		mux.HandleFunc("GET /api/recap/{user_id}/{year}/share", deps.RecapHandler.Share)
	}

	var handler http.Handler = mux
	if deps.AuthService != nil {
		handler = middleware.OptionalAuth(deps.AuthService, deps.Logger)(handler)
	}
	handler = middleware.Recovery(deps.Logger)(handler)
	handler = middleware.Logger(deps.Logger)(handler)
	handler = middleware.CORS(handler)

	return &Server{
		logger: deps.Logger,
		httpServer: &http.Server{
			Addr:              deps.Addr,
			Handler:           handler,
			ReadHeaderTimeout: 5 * time.Second,
			ReadTimeout:       15 * time.Second,
			WriteTimeout:      60 * time.Second, // generate-all может быть дольше
			IdleTimeout:       60 * time.Second,
		},
	}
}

func (s *Server) Start() error {
	s.logger.Info("http server starting", slog.String("addr", s.httpServer.Addr))
	return s.httpServer.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	return s.httpServer.Shutdown(ctx)
}
