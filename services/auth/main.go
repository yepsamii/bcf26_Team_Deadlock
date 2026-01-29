package main

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"

	"github.com/rafidoth/train-ticket-booking-microservice/auth/config"
	"github.com/rafidoth/train-ticket-booking-microservice/auth/db"
	"github.com/rafidoth/train-ticket-booking-microservice/auth/handlers"
	"github.com/rafidoth/train-ticket-booking-microservice/auth/tracing"
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
	slog.Info("Auth Service Starting", "level", slog.LevelDebug)

	// Initialize tracing
	otelEndpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if otelEndpoint == "" {
		otelEndpoint = "otel-collector:4317"
	}
	shutdownTracer, err := tracing.InitTracing("auth-service")
	if err != nil {
		slog.Error("failed to initialize tracing", "error", err)
	}
	defer shutdownTracer()

	cfg, err := config.LoadConfig()
	if err != nil {
		slog.Error("problem loading env vars", "error", err)
	}

	conn, err := db.NewDatabase(cfg)
	if err != nil {
		slog.Error("unable to configure db : ", "error", err)
	}

	handler := handlers.New(conn)
	server := NewServer(handler, cfg)
	server.Start()
}
