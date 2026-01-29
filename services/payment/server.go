package main

import (
	"log"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rafidoth/payment-service/config"
	"github.com/rafidoth/payment-service/handlers"
	"github.com/rafidoth/payment-service/middleware"
	"github.com/riandyrn/otelchi"
)

type Server struct {
	router  *chi.Mux
	handler *handlers.PaymentHandler
	cfg     *config.Config
}

func NewServer(handler *handlers.PaymentHandler, cfg *config.Config) *Server {
	return &Server{
		router:  chi.NewRouter(),
		cfg:     cfg,
		handler: handler,
	}
}

func (s *Server) registerRoutes() {
	// Apply OpenTelemetry middleware for distributed tracing
	s.router.Use(otelchi.Middleware("payment-service", otelchi.WithChiRoutes(s.router)))

	// Apply Prometheus middleware for RED metrics
	s.router.Use(middleware.PrometheusMiddleware("payment-service"))

	// Expose metrics endpoint for Prometheus scraping
	s.router.Handle("/metrics", promhttp.Handler())

	// Health check endpoint
	s.router.Get("/health", s.handler.Health)

	// Payment endpoints
	s.router.Post("/payments", s.handler.ProcessPayment)
	s.router.Get("/payments/{id}", s.handler.GetPayment)
	s.router.Get("/payments/order/{orderId}", s.handler.GetPaymentByOrderID)
}

func (s *Server) Start() {
	s.registerRoutes()
	addr := s.cfg.Port
	if s.cfg.Port == "" {
		slog.Error("Port not specified in configuration")
	}
	slog.Info("Payment Service is starting.", "port", addr)
	err := http.ListenAndServe(":"+addr, s.router)
	if err != nil {
		log.Fatal("ListenAndServe error: ", err)
	}
}
