package main

import (
	"log"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rafidoth/orders-service/config"
	"github.com/rafidoth/orders-service/handlers"
	"github.com/rafidoth/orders-service/middleware"
	"github.com/riandyrn/otelchi"
)

type Server struct {
	router  *chi.Mux
	handler *handlers.OrdersHandler
	cfg     *config.Config
}

func NewServer(handler *handlers.OrdersHandler, cfg *config.Config) *Server {
	return &Server{
		router:  chi.NewRouter(),
		cfg:     cfg,
		handler: handler,
	}
}

func (s *Server) registerRoutes() {
	// Apply OpenTelemetry middleware for distributed tracing
	s.router.Use(otelchi.Middleware("orders-service", otelchi.WithChiRoutes(s.router)))

	// Apply Prometheus middleware for RED metrics
	s.router.Use(middleware.PrometheusMiddleware("orders-service"))

	// Expose metrics endpoint for Prometheus scraping
	s.router.Handle("/metrics", promhttp.Handler())

	// Health check endpoint
	s.router.Get("/health", s.handler.Health)

	// Order endpoints
	s.router.Post("/orders", s.handler.CreateOrder)
	s.router.Get("/orders/{id}", s.handler.GetOrder)
}

func (s *Server) Start() {
	s.registerRoutes()
	addr := s.cfg.Port
	if s.cfg.Port == "" {
		slog.Error("Port not specified in configuration")
	}
	slog.Info("Orders Service is starting.", "port", addr)
	err := http.ListenAndServe(":"+addr, s.router)
	if err != nil {
		log.Fatal("ListenAndServe error: ", err)
	}
}
