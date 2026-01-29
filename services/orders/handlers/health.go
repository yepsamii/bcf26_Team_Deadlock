package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"
)

type HealthResponse struct {
	Status   string `json:"status"`
	Service  string `json:"service"`
	Database string `json:"database"`
	Message  string `json:"message,omitempty"`
}

func (h *OrdersHandler) Health(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	err := h.db.Ping(ctx)
	w.Header().Set("Content-Type", "application/json")

	if err != nil {
		response := HealthResponse{
			Status:   "unhealthy",
			Service:  "orders-service",
			Database: "disconnected",
			Message:  "Database connection failed: " + err.Error(),
		}
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(response)
		return
	}

	response := HealthResponse{
		Status:   "healthy",
		Service:  "orders-service",
		Database: "connected",
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
