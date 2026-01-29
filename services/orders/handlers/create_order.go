package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

type CreateOrderRequest struct {
	UserID    string `json:"user_id"`
	ProductID string `json:"product_id"`
	Quantity  int    `json:"quantity"`
}

type CreateOrderResponse struct {
	Order   Order  `json:"order"`
	Message string `json:"message,omitempty"`
}

func (h *OrdersHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var req CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Error("Failed to decode request body", "error", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.UserID == "" || req.ProductID == "" || req.Quantity <= 0 {
		slog.Warn("Invalid order request", "user_id", req.UserID, "product_id", req.ProductID, "quantity", req.Quantity)
		http.Error(w, "user_id, product_id, and quantity (>0) are required", http.StatusBadRequest)
		return
	}

	var order Order
	err := h.db.QueryRow(
		r.Context(),
		`INSERT INTO orders (user_id, product_id, quantity, status)
		 VALUES ($1, $2, $3, 'PENDING')
		 RETURNING id, user_id, product_id, quantity, status, created_at, updated_at`,
		req.UserID, req.ProductID, req.Quantity,
	).Scan(&order.ID, &order.UserID, &order.ProductID, &order.Quantity,
		&order.Status, &order.CreatedAt, &order.UpdatedAt)

	if err != nil {
		slog.Error("Failed to create order", "error", err)
		http.Error(w, "Failed to create order: "+err.Error(), http.StatusInternalServerError)
		return
	}

	slog.Info("Order created successfully", "order_id", order.ID, "user_id", order.UserID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(CreateOrderResponse{Order: order})
}
