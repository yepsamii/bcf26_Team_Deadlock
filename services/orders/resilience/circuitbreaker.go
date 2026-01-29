package resilience

import (
	"context"
	"errors"
	"log/slog"
	"sync"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
)

// State represents the circuit breaker state
type State int

const (
	StateClosed   State = iota // Normal operation, requests are allowed
	StateOpen                  // Circuit is open, requests are blocked
	StateHalfOpen              // Testing if service has recovered
)

func (s State) String() string {
	switch s {
	case StateClosed:
		return "CLOSED"
	case StateOpen:
		return "OPEN"
	case StateHalfOpen:
		return "HALF-OPEN"
	default:
		return "UNKNOWN"
	}
}

// Sentinel errors for circuit breaker
var (
	ErrCircuitOpen = errors.New("circuit breaker is open")
)

// CircuitBreaker implements the circuit breaker pattern
type CircuitBreaker struct {
	name            string
	maxFailures     int
	timeout         time.Duration
	failureCount    int
	lastFailureTime time.Time
	state           State
	mutex           sync.RWMutex
}

// NewCircuitBreaker creates a new circuit breaker with the given configuration
func NewCircuitBreaker(name string, maxFailures int, timeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		name:        name,
		maxFailures: maxFailures,
		timeout:     timeout,
		state:       StateClosed,
	}
}

// Execute runs the given function with circuit breaker protection
func (cb *CircuitBreaker) Execute(ctx context.Context, fn func() error) error {
	tracer := otel.Tracer("orders-service")
	ctx, span := tracer.Start(ctx, "CircuitBreaker.Execute")
	defer span.End()

	span.SetAttributes(
		attribute.String("circuit_breaker.name", cb.name),
		attribute.String("circuit_breaker.state", cb.getState().String()),
	)

	// Check if we can proceed
	if !cb.allowRequest() {
		span.SetAttributes(attribute.Bool("circuit_breaker.blocked", true))
		span.SetStatus(codes.Error, "circuit breaker is open")
		slog.Warn("Circuit breaker is open, rejecting request",
			"name", cb.name,
			"state", cb.getState().String(),
			"failure_count", cb.getFailureCount(),
		)
		return ErrCircuitOpen
	}

	span.SetAttributes(attribute.Bool("circuit_breaker.blocked", false))

	// Execute the function
	err := fn()

	if err != nil {
		cb.recordFailure()
		span.SetAttributes(attribute.Int("circuit_breaker.failure_count", cb.getFailureCount()))
		span.RecordError(err)
		span.SetStatus(codes.Error, "operation failed")
		slog.Warn("Circuit breaker recorded failure",
			"name", cb.name,
			"error", err,
			"failure_count", cb.getFailureCount(),
			"state", cb.getState().String(),
		)
		return err
	}

	cb.recordSuccess()
	span.SetStatus(codes.Ok, "operation succeeded")
	return nil
}

// allowRequest checks if a request should be allowed based on the circuit state
func (cb *CircuitBreaker) allowRequest() bool {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()

	switch cb.state {
	case StateClosed:
		return true
	case StateOpen:
		// Check if timeout has elapsed
		if time.Since(cb.lastFailureTime) > cb.timeout {
			slog.Info("Circuit breaker transitioning to half-open",
				"name", cb.name,
				"timeout_elapsed", time.Since(cb.lastFailureTime),
			)
			cb.state = StateHalfOpen
			return true
		}
		return false
	case StateHalfOpen:
		return true
	default:
		return false
	}
}

// recordFailure records a failure and potentially opens the circuit
func (cb *CircuitBreaker) recordFailure() {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()

	cb.failureCount++
	cb.lastFailureTime = time.Now()

	if cb.state == StateHalfOpen {
		// Failure in half-open state immediately opens the circuit
		slog.Warn("Failure in half-open state, reopening circuit",
			"name", cb.name,
		)
		cb.state = StateOpen
		return
	}

	if cb.failureCount >= cb.maxFailures {
		slog.Warn("Circuit breaker opened due to max failures reached",
			"name", cb.name,
			"failure_count", cb.failureCount,
			"max_failures", cb.maxFailures,
		)
		cb.state = StateOpen
	}
}

// recordSuccess records a successful call and potentially closes the circuit
func (cb *CircuitBreaker) recordSuccess() {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()

	if cb.state == StateHalfOpen {
		slog.Info("Circuit breaker closing after successful call in half-open state",
			"name", cb.name,
		)
		cb.state = StateClosed
		cb.failureCount = 0
	}
}

// getState returns the current state (thread-safe)
func (cb *CircuitBreaker) getState() State {
	cb.mutex.RLock()
	defer cb.mutex.RUnlock()
	return cb.state
}

// getFailureCount returns the current failure count (thread-safe)
func (cb *CircuitBreaker) getFailureCount() int {
	cb.mutex.RLock()
	defer cb.mutex.RUnlock()
	return cb.failureCount
}

// State returns the current circuit breaker state
func (cb *CircuitBreaker) State() State {
	return cb.getState()
}

// FailureCount returns the current failure count
func (cb *CircuitBreaker) FailureCount() int {
	return cb.getFailureCount()
}

// Reset resets the circuit breaker to its initial state
func (cb *CircuitBreaker) Reset() {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()
	cb.state = StateClosed
	cb.failureCount = 0
	cb.lastFailureTime = time.Time{}
}
