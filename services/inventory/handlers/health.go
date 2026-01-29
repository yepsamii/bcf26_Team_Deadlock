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

func (h *InventoryHandler) Health(w http.ResponseWriter, r *http.Request) {
	// Create a context with timeout for the database ping
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Ping the database to verify connectivity
	err := h.db.Ping(ctx)

	w.Header().Set("Content-Type", "application/json")

	if err != nil {
		// Database is not healthy
		response := HealthResponse{
			Status:   "unhealthy",
			Service:  "inventory-service",
			Database: "disconnected",
			Message:  "Database connection failed: " + err.Error(),
		}
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Everything is healthy
	response := HealthResponse{
		Status:   "healthy",
		Service:  "inventory-service",
		Database: "connected",
		Message:  "Service is running properly",
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
