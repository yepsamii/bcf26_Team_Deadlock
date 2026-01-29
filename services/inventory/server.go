package main

import (
	"log"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rafidoth/train-ticket-booking-microservice/inventory/config"
	"github.com/rafidoth/train-ticket-booking-microservice/inventory/handlers"
	"github.com/rafidoth/train-ticket-booking-microservice/inventory/middleware"
	"github.com/riandyrn/otelchi"
)

type Server struct {
	router  *chi.Mux
	handler *handlers.InventoryHandler
	cfg     *config.Config
}

func NewServer(inventoryHandler *handlers.InventoryHandler, cfg *config.Config) *Server {
	return &Server{
		router:  chi.NewRouter(),
		cfg:     cfg,
		handler: inventoryHandler,
	}
}

func (s *Server) registerRoutes() {
	// Apply OpenTelemetry middleware for distributed tracing
	s.router.Use(otelchi.Middleware("inventory-service", otelchi.WithChiRoutes(s.router)))

	// Apply Prometheus middleware for RED metrics
	s.router.Use(middleware.PrometheusMiddleware("inventory-service"))

	// Expose metrics endpoint for Prometheus scraping
	s.router.Handle("/metrics", promhttp.Handler())

	// Health check endpoint
	s.router.Get("/health", s.handler.Health)

	// Product endpoints
	s.router.Post("/products", s.handler.CreateProduct)
	s.router.Get("/products", s.handler.GetAllProducts)
	s.router.Get("/products/{id}", s.handler.GetProduct)
	s.router.Put("/products/{id}", s.handler.UpdateProduct)
	s.router.Delete("/products/{id}", s.handler.DeleteProduct)
	s.router.Post("/products/{id}/reserve", s.handler.ReserveProduct)
	s.router.Post("/products/{id}/release", s.handler.ReleaseProduct)
}

func (s *Server) Start() {
	s.registerRoutes()
	addr := s.cfg.Port
	if s.cfg.Port == "" {
		slog.Error("Port not specified in configuration")
	}
	slog.Info("Inventory Service is starting.", "port", addr, "level", slog.LevelInfo)
	err := http.ListenAndServe(":"+addr, s.router)
	if err != nil {
		log.Fatal("ListenAndServe error: ", err)
	}
}
