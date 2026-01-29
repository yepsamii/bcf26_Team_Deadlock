package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"
)

type HealthResponse struct {
	Status   string `json:"status"`
	Database string `json:"database"`
	Message  string `json:"message,omitempty"`
}

// Health checks the health of the service by pinging the database
func (h *AuthHandler) Health(w http.ResponseWriter, r *http.Request) {
	// Create a context with timeout for the database ping
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Ping the database
	err := h.db.Ping(ctx)
	
	w.Header().Set("Content-Type", "application/json")
	
	if err != nil {
		// Database is not healthy
		response := HealthResponse{
			Status:   "unhealthy",
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
		Database: "connected",
		Message:  "Service is running properly",
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
