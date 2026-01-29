package clients

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/rafidoth/orders-service/resilience"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/propagation"
)

// Sentinel errors for inventory client
var (
	ErrInsufficientStock = errors.New("insufficient stock available")
	ErrProductNotFound   = errors.New("product not found")
	ErrInventoryService  = errors.New("inventory service error")
)

// ReservationResponse represents the response from inventory reservation
type ReservationResponse struct {
	ID                string    `json:"id"`
	Title             string    `json:"title"`
	Price             float64   `json:"price"`
	AvailableQuantity int       `json:"available_quantity"`
	Reserved          int       `json:"reserved"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// reserveRequest represents the request body for reserve/release operations
type reserveRequest struct {
	Quantity int `json:"quantity"`
}

// InventoryClient handles HTTP calls to the inventory service with resilience
type InventoryClient struct {
	baseURL        string
	client         *http.Client
	circuitBreaker *resilience.CircuitBreaker
	maxRetries     int
	retryDelay     time.Duration
}

// NewInventoryClient creates a new inventory client with circuit breaker protection
func NewInventoryClient(baseURL string, requestTimeout time.Duration, cbMaxFailures int, cbTimeout time.Duration) *InventoryClient {
	return &InventoryClient{
		baseURL: baseURL,
		client: &http.Client{
			Timeout: requestTimeout,
		},
		circuitBreaker: resilience.NewCircuitBreaker("inventory-service", cbMaxFailures, cbTimeout),
		maxRetries:     3,
		retryDelay:     100 * time.Millisecond,
	}
}

// ReserveProduct reserves a quantity of a product in the inventory service
func (c *InventoryClient) ReserveProduct(ctx context.Context, productID string, quantity int) (*ReservationResponse, error) {
	tracer := otel.Tracer("orders-service")
	ctx, span := tracer.Start(ctx, "InventoryClient.ReserveProduct")
	defer span.End()

	span.SetAttributes(
		attribute.String("product.id", productID),
		attribute.Int("quantity", quantity),
		attribute.String("inventory.base_url", c.baseURL),
	)

	slog.Info("Attempting to reserve product",
		"product_id", productID,
		"quantity", quantity,
	)

	var lastErr error
	var response *ReservationResponse

	// Execute with circuit breaker protection
	err := c.circuitBreaker.Execute(ctx, func() error {
		var innerErr error
		response, innerErr = c.doReserveWithRetry(ctx, productID, quantity)
		return innerErr
	})

	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	span.SetStatus(codes.Ok, "product reserved successfully")
	slog.Info("Product reserved successfully",
		"product_id", productID,
		"quantity", quantity,
		"available_quantity", response.AvailableQuantity,
	)

	if lastErr != nil {
		return nil, lastErr
	}

	return response, nil
}

// doReserveWithRetry performs the reserve operation with exponential backoff retry
func (c *InventoryClient) doReserveWithRetry(ctx context.Context, productID string, quantity int) (*ReservationResponse, error) {
	tracer := otel.Tracer("orders-service")

	var lastErr error
	delay := c.retryDelay

	for attempt := 0; attempt <= c.maxRetries; attempt++ {
		ctx, span := tracer.Start(ctx, "InventoryClient.ReserveProduct.Attempt")
		span.SetAttributes(
			attribute.Int("attempt", attempt+1),
			attribute.Int("max_retries", c.maxRetries+1),
		)

		response, err := c.doReserve(ctx, productID, quantity)
		if err == nil {
			span.SetStatus(codes.Ok, "success")
			span.End()
			return response, nil
		}

		lastErr = err
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		span.End()

		// Don't retry on client errors (insufficient stock, product not found)
		if errors.Is(err, ErrInsufficientStock) || errors.Is(err, ErrProductNotFound) {
			return nil, err
		}

		// Don't retry on context cancellation
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}

		// Check if we've exhausted retries
		if attempt < c.maxRetries {
			slog.Info("Retrying reserve operation after failure",
				"attempt", attempt+1,
				"max_retries", c.maxRetries+1,
				"delay", delay,
				"error", err,
			)
			select {
			case <-time.After(delay):
			case <-ctx.Done():
				return nil, ctx.Err()
			}
			delay *= 2 // Exponential backoff
		}
	}

	return nil, fmt.Errorf("reserve operation failed after %d attempts: %w", c.maxRetries+1, lastErr)
}

// doReserve performs a single reserve HTTP request
func (c *InventoryClient) doReserve(ctx context.Context, productID string, quantity int) (*ReservationResponse, error) {
	url := fmt.Sprintf("%s/products/%s/reserve", c.baseURL, productID)

	reqBody := reserveRequest{Quantity: quantity}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	// Propagate trace context
	otel.GetTextMapPropagator().Inject(ctx, propagation.HeaderCarrier(req.Header))

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInventoryService, err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	switch resp.StatusCode {
	case http.StatusOK:
		var response ReservationResponse
		if err := json.Unmarshal(body, &response); err != nil {
			return nil, fmt.Errorf("failed to unmarshal response: %w", err)
		}
		return &response, nil
	case http.StatusBadRequest:
		// Could be insufficient stock or product not found
		if bytes.Contains(body, []byte("Insufficient")) {
			return nil, ErrInsufficientStock
		}
		return nil, ErrProductNotFound
	case http.StatusNotFound:
		return nil, ErrProductNotFound
	default:
		return nil, fmt.Errorf("%w: status %d, body: %s", ErrInventoryService, resp.StatusCode, string(body))
	}
}

// ReleaseProduct releases a reserved quantity of a product in the inventory service
func (c *InventoryClient) ReleaseProduct(ctx context.Context, productID string, quantity int) error {
	tracer := otel.Tracer("orders-service")
	ctx, span := tracer.Start(ctx, "InventoryClient.ReleaseProduct")
	defer span.End()

	span.SetAttributes(
		attribute.String("product.id", productID),
		attribute.Int("quantity", quantity),
	)

	slog.Info("Attempting to release product",
		"product_id", productID,
		"quantity", quantity,
	)

	err := c.circuitBreaker.Execute(ctx, func() error {
		return c.doReleaseWithRetry(ctx, productID, quantity)
	})

	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return err
	}

	span.SetStatus(codes.Ok, "product released successfully")
	slog.Info("Product released successfully",
		"product_id", productID,
		"quantity", quantity,
	)

	return nil
}

// doReleaseWithRetry performs the release operation with exponential backoff retry
func (c *InventoryClient) doReleaseWithRetry(ctx context.Context, productID string, quantity int) error {
	var lastErr error
	delay := c.retryDelay

	for attempt := 0; attempt <= c.maxRetries; attempt++ {
		err := c.doRelease(ctx, productID, quantity)
		if err == nil {
			return nil
		}

		lastErr = err

		// Don't retry on context cancellation
		if ctx.Err() != nil {
			return ctx.Err()
		}

		// Check if we've exhausted retries
		if attempt < c.maxRetries {
			slog.Info("Retrying release operation after failure",
				"attempt", attempt+1,
				"max_retries", c.maxRetries+1,
				"delay", delay,
				"error", err,
			)
			select {
			case <-time.After(delay):
			case <-ctx.Done():
				return ctx.Err()
			}
			delay *= 2 // Exponential backoff
		}
	}

	return fmt.Errorf("release operation failed after %d attempts: %w", c.maxRetries+1, lastErr)
}

// doRelease performs a single release HTTP request
func (c *InventoryClient) doRelease(ctx context.Context, productID string, quantity int) error {
	url := fmt.Sprintf("%s/products/%s/release", c.baseURL, productID)

	reqBody := reserveRequest{Quantity: quantity}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(bodyBytes))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	// Propagate trace context
	otel.GetTextMapPropagator().Inject(ctx, propagation.HeaderCarrier(req.Header))

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrInventoryService, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		return nil
	}

	body, _ := io.ReadAll(resp.Body)
	return fmt.Errorf("%w: status %d, body: %s", ErrInventoryService, resp.StatusCode, string(body))
}

// CircuitState returns the current state of the circuit breaker
func (c *InventoryClient) CircuitState() resilience.State {
	return c.circuitBreaker.State()
}
