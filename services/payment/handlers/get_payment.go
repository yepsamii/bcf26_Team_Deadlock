package handlers

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rafidoth/payment-service/tracing"
)

func (h *PaymentHandler) GetPayment(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracing.StartSpan(r.Context(), "GetPayment")
	defer span.End()

	paymentID := chi.URLParam(r, "id")
	if paymentID == "" {
		writeError(w, http.StatusBadRequest, "Payment ID is required")
		return
	}

	query := `
		SELECT id, order_id, user_id, amount, status, card_last_four, card_brand, transaction_id, COALESCE(failure_reason, ''), created_at, updated_at
		FROM payments
		WHERE id = $1
	`

	var payment Payment
	err := h.db.QueryRow(ctx, query, paymentID).Scan(
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
		slog.Error("failed to get payment", "error", err, "paymentID", paymentID, "traceID", tracing.GetTraceID(ctx))
		writeError(w, http.StatusNotFound, "Payment not found")
		return
	}

	writeJSON(w, http.StatusOK, payment)
}

func (h *PaymentHandler) GetPaymentByOrderID(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracing.StartSpan(r.Context(), "GetPaymentByOrderID")
	defer span.End()

	orderID := chi.URLParam(r, "orderId")
	if orderID == "" {
		writeError(w, http.StatusBadRequest, "Order ID is required")
		return
	}

	query := `
		SELECT id, order_id, user_id, amount, status, card_last_four, card_brand, transaction_id, COALESCE(failure_reason, ''), created_at, updated_at
		FROM payments
		WHERE order_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`

	var payment Payment
	err := h.db.QueryRow(ctx, query, orderID).Scan(
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
		slog.Error("failed to get payment by order", "error", err, "orderID", orderID, "traceID", tracing.GetTraceID(ctx))
		writeError(w, http.StatusNotFound, "Payment not found for this order")
		return
	}

	writeJSON(w, http.StatusOK, payment)
}
