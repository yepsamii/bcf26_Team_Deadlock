package main

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"

	"github.com/rafidoth/payment-service/config"
	"github.com/rafidoth/payment-service/db"
	"github.com/rafidoth/payment-service/handlers"
	"github.com/rafidoth/payment-service/tracing"
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
	slog.Info("Payment Service Starting")

	// Initialize tracing
	shutdownTracer, err := tracing.InitTracing("payment-service")
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

	handler := handlers.New(conn)
	server := NewServer(handler, cfg)
	server.Start()
}
