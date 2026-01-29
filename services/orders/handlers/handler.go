package handlers

import (
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type OrdersHandler struct {
	db *pgxpool.Pool
}

func New(conn *pgxpool.Pool) *OrdersHandler {
	return &OrdersHandler{db: conn}
}

type Order struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	ProductID string    `json:"product_id"`
	Quantity  int       `json:"quantity"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
