package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (h *OrdersHandler) GetOrder(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "id")
	if orderID == "" {
		http.Error(w, "Order ID is required", http.StatusBadRequest)
		return
	}

	var order Order
	err := h.db.QueryRow(
		r.Context(),
		`SELECT id, user_id, product_id, quantity, status, created_at, updated_at
		 FROM orders WHERE id = $1`,
		orderID,
	).Scan(&order.ID, &order.UserID, &order.ProductID, &order.Quantity,
		&order.Status, &order.CreatedAt, &order.UpdatedAt)

	if err != nil {
		slog.Warn("Order not found", "order_id", orderID, "error", err)
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	slog.Info("Order retrieved", "order_id", order.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(order)
}
