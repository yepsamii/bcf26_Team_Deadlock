package main

import (
	"log"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rafidoth/train-ticket-booking-microservice/auth/config"
	"github.com/rafidoth/train-ticket-booking-microservice/auth/handlers"
	"github.com/rafidoth/train-ticket-booking-microservice/auth/middleware"
	"github.com/riandyrn/otelchi"
)

type Server struct {
	router  *chi.Mux
	handler *handlers.AuthHandler
	cfg     *config.Config
}

func NewServer(authHandler *handlers.AuthHandler, cfg *config.Config) *Server {
	return &Server{
		router:  chi.NewRouter(),
		cfg:     cfg,
		handler: authHandler,
	}
}

func (s *Server) registerRoutes() {
	// Apply OpenTelemetry middleware for distributed tracing
	s.router.Use(otelchi.Middleware("auth-service", otelchi.WithChiRoutes(s.router)))

	// Apply Prometheus middleware for RED metrics
	s.router.Use(middleware.PrometheusMiddleware("auth-service"))

	// Expose metrics endpoint for Prometheus scraping
	s.router.Handle("/metrics", promhttp.Handler())

	// Health check endpoint
	s.router.Get("/health", s.handler.Health)

	s.router.Post("/register", s.handler.Register)
	s.router.Post("/login", s.handler.Login)
}

func (s *Server) Start() {
	s.registerRoutes()
	addr := s.cfg.Port
	if s.cfg.Port == "" {
		slog.Error("Port not specified in configuration")
	}
	slog.Info("Auth Service is starting.", "port", addr, "level", slog.LevelInfo)
	err := http.ListenAndServe(":"+addr, s.router)
	if err != nil {
		log.Fatal("ListenAndServe error: ", err)
	}
}
