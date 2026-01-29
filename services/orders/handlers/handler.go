package handlers

import (
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rafidoth/orders-service/clients"
)

type OrdersHandler struct {
	db              *pgxpool.Pool
	inventoryClient *clients.InventoryClient
}

func New(conn *pgxpool.Pool, inventoryClient *clients.InventoryClient) *OrdersHandler {
	return &OrdersHandler{
		db:              conn,
		inventoryClient: inventoryClient,
	}
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
