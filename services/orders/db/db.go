package db

import (
	"context"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rafidoth/orders-service/config"
)

func NewDatabase(cfg *config.Config) (*pgxpool.Pool, error) {
	conn, err := pgxpool.New(context.Background(), cfg.DB.DBString)
	if err != nil {
		return nil, err
	}
	slog.Info("Connected to database successfully")
	return conn, nil
}
