package db

import (
	"context"
	"fmt"
	"log/slog"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rafidoth/train-ticket-booking-microservice/inventory/config"
)

func NewDatabase(cfg *config.Config) (*pgxpool.Pool, error) {
	if cfg.DB.DBString == "" {
		fmt.Println("Failed to get env : DBSTRING")
		os.Exit(1)
	}

	conn, err := pgxpool.New(context.Background(), cfg.DB.DBString)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}

	slog.Info("Connected to the database successfully.", "level", slog.LevelInfo)

	return conn, nil
}
