package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PaymentHandler struct {
	db *pgxpool.Pool
}

func New(conn *pgxpool.Pool) *PaymentHandler {
	return &PaymentHandler{db: conn}
}

type Payment struct {
	ID            string    `json:"id"`
	OrderID       string    `json:"order_id"`
	UserID        string    `json:"user_id"`
	Amount        float64   `json:"amount"`
	Status        string    `json:"status"`
	CardLastFour  string    `json:"card_last_four,omitempty"`
	CardBrand     string    `json:"card_brand,omitempty"`
	TransactionID string    `json:"transaction_id,omitempty"`
	FailureReason string    `json:"failure_reason,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ProcessPaymentRequest struct {
	OrderID        string  `json:"order_id"`
	UserID         string  `json:"user_id"`
	Amount         float64 `json:"amount"`
	CardNumber     string  `json:"card_number"`
	ExpiryMonth    string  `json:"expiry_month"`
	ExpiryYear     string  `json:"expiry_year"`
	CVV            string  `json:"cvv"`
	CardholderName string  `json:"cardholder_name"`
}

type PaymentResponse struct {
	Success bool     `json:"success"`
	Message string   `json:"message"`
	Payment *Payment `json:"payment,omitempty"`
}

func (h *PaymentHandler) Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "payment-service",
	})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
