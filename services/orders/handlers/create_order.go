package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/rafidoth/orders-service/clients"
	"github.com/rafidoth/orders-service/resilience"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
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

// Default timeout for inventory operations
const inventoryTimeout = 3 * time.Second

func (h *OrdersHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	tracer := otel.Tracer("orders-service")
	ctx, span := tracer.Start(r.Context(), "CreateOrder")
	defer span.End()

	var req CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Error("Failed to decode request body", "error", err)
		span.RecordError(err)
		span.SetStatus(codes.Error, "invalid request body")
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	span.SetAttributes(
		attribute.String("user_id", req.UserID),
		attribute.String("product_id", req.ProductID),
		attribute.Int("quantity", req.Quantity),
	)

	if req.UserID == "" || req.ProductID == "" || req.Quantity <= 0 {
		slog.Warn("Invalid order request", "user_id", req.UserID, "product_id", req.ProductID, "quantity", req.Quantity)
		span.SetStatus(codes.Error, "validation failed")
		http.Error(w, "user_id, product_id, and quantity (>0) are required", http.StatusBadRequest)
		return
	}

	// Determine initial order status and try to reserve inventory
	orderStatus := "PENDING"
	message := ""
	degradedMode := false

	// Try to reserve inventory with timeout
	if h.inventoryClient != nil {
		inventoryCtx, cancel := context.WithTimeout(ctx, inventoryTimeout)
		defer cancel()

		_, inventorySpan := tracer.Start(inventoryCtx, "CreateOrder.ReserveInventory")
		inventorySpan.SetAttributes(
			attribute.String("product_id", req.ProductID),
			attribute.Int("quantity", req.Quantity),
		)

		slog.Info("Attempting to reserve inventory",
			"product_id", req.ProductID,
			"quantity", req.Quantity,
		)

		reserveResp, err := h.inventoryClient.ReserveProduct(inventoryCtx, req.ProductID, req.Quantity)

		if err != nil {
			inventorySpan.RecordError(err)

			// Check for graceful degradation scenarios
			if errors.Is(err, resilience.ErrCircuitOpen) {
				slog.Warn("Circuit breaker is open, accepting order in degraded mode",
					"product_id", req.ProductID,
					"error", err,
				)
				inventorySpan.SetStatus(codes.Error, "circuit breaker open")
				orderStatus = "PENDING_INVENTORY"
				message = "Order accepted. Inventory will be reserved when service is available."
				degradedMode = true
			} else if errors.Is(err, context.DeadlineExceeded) || inventoryCtx.Err() != nil {
				slog.Warn("Inventory service timeout, accepting order in degraded mode",
					"product_id", req.ProductID,
					"error", err,
				)
				inventorySpan.SetStatus(codes.Error, "timeout")
				orderStatus = "PENDING_INVENTORY"
				message = "Order accepted. Inventory will be reserved shortly."
				degradedMode = true
			} else if errors.Is(err, clients.ErrInsufficientStock) {
				slog.Warn("Insufficient stock for order",
					"product_id", req.ProductID,
					"quantity", req.Quantity,
				)
				inventorySpan.SetStatus(codes.Error, "insufficient stock")
				inventorySpan.End()
				span.SetStatus(codes.Error, "insufficient stock")
				http.Error(w, "Insufficient stock available for this product", http.StatusConflict)
				return
			} else if errors.Is(err, clients.ErrProductNotFound) {
				slog.Warn("Product not found",
					"product_id", req.ProductID,
				)
				inventorySpan.SetStatus(codes.Error, "product not found")
				inventorySpan.End()
				span.SetStatus(codes.Error, "product not found")
				http.Error(w, "Product not found", http.StatusNotFound)
				return
			} else {
				// Other errors - still accept in degraded mode
				slog.Warn("Inventory service error, accepting order in degraded mode",
					"product_id", req.ProductID,
					"error", err,
				)
				inventorySpan.SetStatus(codes.Error, "inventory service error")
				orderStatus = "PENDING_INVENTORY"
				message = "Order accepted. Inventory reservation will be retried."
				degradedMode = true
			}
		} else {
			// Success! Inventory reserved
			slog.Info("Inventory reserved successfully",
				"product_id", req.ProductID,
				"quantity", req.Quantity,
				"available_quantity", reserveResp.AvailableQuantity,
			)
			inventorySpan.SetStatus(codes.Ok, "inventory reserved")
			orderStatus = "CONFIRMED"
		}
		inventorySpan.End()
	}

	span.SetAttributes(
		attribute.String("order_status", orderStatus),
		attribute.Bool("degraded_mode", degradedMode),
	)

	// Create the order in the database
	_, dbSpan := tracer.Start(ctx, "CreateOrder.DatabaseInsert")
	dbSpan.SetAttributes(
		attribute.String("db.system", "postgresql"),
		attribute.String("db.operation", "INSERT"),
		attribute.String("db.table", "orders"),
	)

	var order Order
	err := h.db.QueryRow(
		r.Context(),
		`INSERT INTO orders (user_id, product_id, quantity, status)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, user_id, product_id, quantity, status, created_at, updated_at`,
		req.UserID, req.ProductID, req.Quantity, orderStatus,
	).Scan(&order.ID, &order.UserID, &order.ProductID, &order.Quantity,
		&order.Status, &order.CreatedAt, &order.UpdatedAt)

	if err != nil {
		slog.Error("Failed to create order", "error", err)
		dbSpan.RecordError(err)
		dbSpan.SetStatus(codes.Error, "database insert failed")
		dbSpan.End()
		span.SetStatus(codes.Error, "failed to create order")
		http.Error(w, "Failed to create order: "+err.Error(), http.StatusInternalServerError)
		return
	}

	dbSpan.SetAttributes(attribute.String("order.id", order.ID))
	dbSpan.SetStatus(codes.Ok, "order created")
	dbSpan.End()

	slog.Info("Order created successfully",
		"order_id", order.ID,
		"user_id", order.UserID,
		"status", order.Status,
		"degraded_mode", degradedMode,
	)

	span.SetStatus(codes.Ok, "order created")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(CreateOrderResponse{Order: order, Message: message})
}
