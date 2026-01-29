package handlers

import (
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type InventoryHandler struct {
	db *pgxpool.Pool
}

func New(conn *pgxpool.Pool) *InventoryHandler {
	return &InventoryHandler{db: conn}
}

type Product struct {
	ID                string    `json:"id"`
	Title             string    `json:"title"`
	Price             float64   `json:"price"`
	AvailableQuantity int       `json:"available_quantity"`
	Reserved          int       `json:"reserved"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}
