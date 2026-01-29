package main

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"time"

	"github.com/rafidoth/orders-service/clients"
	"github.com/rafidoth/orders-service/config"
	"github.com/rafidoth/orders-service/db"
	"github.com/rafidoth/orders-service/handlers"
	"github.com/rafidoth/orders-service/tracing"
)

func init() {
	opts := &slog.HandlerOptions{
		AddSource: true,
		Level:     slog.LevelDebug,
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			if a.Key == slog.TimeKey {
				return slog.String("time", a.Value.Time().Format("15:04:05"))
			}
			if a.Key == slog.SourceKey {
				source := a.Value.Any().(*slog.Source)
				return slog.String("source", fmt.Sprintf("%s:%d", filepath.Base(source.File), source.Line))
			}
			return a
		},
	}

	handler := slog.NewTextHandler(os.Stdout, opts)
	slog.SetDefault(slog.New(handler))
}

func main() {
	slog.Info("Orders Service Starting")

	// Initialize tracing
	shutdownTracer, err := tracing.InitTracing("orders-service")
	if err != nil {
		slog.Error("failed to initialize tracing", "error", err)
	}
	defer shutdownTracer()

	cfg, err := config.LoadConfig()
	if err != nil {
		slog.Error("problem loading config", "error", err)
		os.Exit(1)
	}

	conn, err := db.NewDatabase(cfg)
	if err != nil {
		slog.Error("unable to connect to db", "error", err)
		os.Exit(1)
	}

	// Initialize inventory client with circuit breaker protection
	slog.Info("Initializing inventory client",
		"base_url", cfg.InventoryServiceURL,
		"timeout_seconds", cfg.Resilience.TimeoutSeconds,
		"circuit_max_failures", cfg.Resilience.CircuitMaxFailures,
		"circuit_timeout_seconds", cfg.Resilience.CircuitTimeoutSeconds,
	)

	inventoryClient := clients.NewInventoryClient(
		cfg.InventoryServiceURL,
		time.Duration(cfg.Resilience.TimeoutSeconds)*time.Second,
		cfg.Resilience.CircuitMaxFailures,
		time.Duration(cfg.Resilience.CircuitTimeoutSeconds)*time.Second,
	)

	handler := handlers.New(conn, inventoryClient)
	server := NewServer(handler, cfg)
	server.Start()
}

