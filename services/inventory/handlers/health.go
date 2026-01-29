package handlers

import (
	"encoding/json"
	"net/http"
)

type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
}

func (h *InventoryHandler) Health(w http.ResponseWriter, r *http.Request) {
	response := HealthResponse{
		Status:  "healthy",
		Service: "inventory-service",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
