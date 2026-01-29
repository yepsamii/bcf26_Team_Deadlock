package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/rafidoth/payment-service/tracing"
)

const (
	StatusPending   = "PENDING"
	StatusCompleted = "COMPLETED"
	StatusFailed    = "FAILED"

	// Test card that always declines
	DeclineTestCard = "4000000000000002"
)

func (h *PaymentHandler) ProcessPayment(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracing.StartSpan(r.Context(), "ProcessPayment")
	defer span.End()

	var req ProcessPaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Error("failed to decode request", "error", err, "traceID", tracing.GetTraceID(ctx))
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if err := validatePaymentRequest(&req); err != nil {
		slog.Error("validation failed", "error", err, "traceID", tracing.GetTraceID(ctx))
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Extract card info
	cardNumber := strings.ReplaceAll(req.CardNumber, " ", "")
	cardLastFour := cardNumber[len(cardNumber)-4:]
	cardBrand := detectCardBrand(cardNumber)

	// Generate transaction ID
	transactionID := generateTransactionID()

	// Check for test decline card
	var status string
	var failureReason string

	if cardNumber == DeclineTestCard {
		status = StatusFailed
		failureReason = "Card declined - insufficient funds"
		slog.Info("payment declined (test card)", "orderID", req.OrderID, "traceID", tracing.GetTraceID(ctx))
	} else {
		status = StatusCompleted
		slog.Info("payment approved", "orderID", req.OrderID, "traceID", tracing.GetTraceID(ctx))
	}

	// Save payment to database
	payment, err := h.savePayment(ctx, &req, status, cardLastFour, cardBrand, transactionID, failureReason)
	if err != nil {
		slog.Error("failed to save payment", "error", err, "traceID", tracing.GetTraceID(ctx))
		writeError(w, http.StatusInternalServerError, "Failed to process payment")
		return
	}

	response := PaymentResponse{
		Success: status == StatusCompleted,
		Message: getPaymentMessage(status, failureReason),
		Payment: payment,
	}

	if status == StatusCompleted {
		writeJSON(w, http.StatusOK, response)
	} else {
		writeJSON(w, http.StatusPaymentRequired, response)
	}
}

func validatePaymentRequest(req *ProcessPaymentRequest) error {
	if req.OrderID == "" {
		return fmt.Errorf("order_id is required")
	}
	if req.UserID == "" {
		return fmt.Errorf("user_id is required")
	}
	if req.Amount <= 0 {
		return fmt.Errorf("amount must be greater than 0")
	}

	cardNumber := strings.ReplaceAll(req.CardNumber, " ", "")
	if len(cardNumber) < 13 || len(cardNumber) > 19 {
		return fmt.Errorf("invalid card number")
	}
	if req.ExpiryMonth == "" || req.ExpiryYear == "" {
		return fmt.Errorf("expiry date is required")
	}
	if len(req.CVV) < 3 || len(req.CVV) > 4 {
		return fmt.Errorf("invalid CVV")
	}
	if req.CardholderName == "" {
		return fmt.Errorf("cardholder name is required")
	}

	return nil
}

func detectCardBrand(cardNumber string) string {
	if len(cardNumber) == 0 {
		return "Unknown"
	}

	firstDigit := cardNumber[0]
	switch firstDigit {
	case '4':
		return "Visa"
	case '5':
		return "Mastercard"
	case '3':
		if len(cardNumber) > 1 && (cardNumber[1] == '4' || cardNumber[1] == '7') {
			return "American Express"
		}
		return "Unknown"
	case '6':
		return "Discover"
	default:
		return "Unknown"
	}
}

func generateTransactionID() string {
	return fmt.Sprintf("txn_%s", uuid.New().String()[:8])
}

func getPaymentMessage(status, failureReason string) string {
	if status == StatusCompleted {
		return "Payment processed successfully"
	}
	if failureReason != "" {
		return failureReason
	}
	return "Payment failed"
}

func (h *PaymentHandler) savePayment(ctx context.Context, req *ProcessPaymentRequest, status, cardLastFour, cardBrand, transactionID, failureReason string) (*Payment, error) {
	query := `
		INSERT INTO payments (order_id, user_id, amount, status, card_last_four, card_brand, transaction_id, failure_reason)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, order_id, user_id, amount, status, card_last_four, card_brand, transaction_id, failure_reason, created_at, updated_at
	`

	var payment Payment
	var failureReasonPtr *string
	if failureReason != "" {
		failureReasonPtr = &failureReason
	}

	err := h.db.QueryRow(ctx, query,
		req.OrderID,
		req.UserID,
		req.Amount,
		status,
		cardLastFour,
		cardBrand,
		transactionID,
		failureReasonPtr,
	).Scan(
		&payment.ID,
		&payment.OrderID,
		&payment.UserID,
		&payment.Amount,
		&payment.Status,
		&payment.CardLastFour,
		&payment.CardBrand,
		&payment.TransactionID,
		&payment.FailureReason,
		&payment.CreatedAt,
		&payment.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &payment, nil
}

// simulateProcessingDelay adds a small delay to simulate real payment processing
func simulateProcessingDelay() {
	time.Sleep(100 * time.Millisecond)
}
