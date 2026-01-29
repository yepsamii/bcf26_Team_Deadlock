package resilience

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"
)

func TestCircuitBreakerStartsInClosedState(t *testing.T) {
	cb := NewCircuitBreaker("test", 5, 30*time.Second)
	if cb.State() != StateClosed {
		t.Errorf("expected circuit breaker to start in CLOSED state, got %s", cb.State())
	}
}

func TestCircuitBreakerOpensAfterMaxFailures(t *testing.T) {
	cb := NewCircuitBreaker("test", 3, 30*time.Second)
	ctx := context.Background()

	testErr := errors.New("test error")

	// Record failures
	for i := 0; i < 3; i++ {
		_ = cb.Execute(ctx, func() error {
			return testErr
		})
	}

	if cb.State() != StateOpen {
		t.Errorf("expected circuit breaker to be OPEN after %d failures, got %s", 3, cb.State())
	}

	if cb.FailureCount() != 3 {
		t.Errorf("expected failure count to be 3, got %d", cb.FailureCount())
	}
}

func TestCircuitBreakerRejectsRequestsWhenOpen(t *testing.T) {
	cb := NewCircuitBreaker("test", 2, 30*time.Second)
	ctx := context.Background()

	testErr := errors.New("test error")

	// Open the circuit
	for i := 0; i < 2; i++ {
		_ = cb.Execute(ctx, func() error {
			return testErr
		})
	}

	// Verify requests are rejected
	err := cb.Execute(ctx, func() error {
		return nil
	})

	if !errors.Is(err, ErrCircuitOpen) {
		t.Errorf("expected ErrCircuitOpen, got %v", err)
	}
}

func TestCircuitBreakerTransitionsToHalfOpenAfterTimeout(t *testing.T) {
	cb := NewCircuitBreaker("test", 2, 50*time.Millisecond)
	ctx := context.Background()

	testErr := errors.New("test error")

	// Open the circuit
	for i := 0; i < 2; i++ {
		_ = cb.Execute(ctx, func() error {
			return testErr
		})
	}

	if cb.State() != StateOpen {
		t.Errorf("expected circuit breaker to be OPEN, got %s", cb.State())
	}

	// Wait for timeout
	time.Sleep(60 * time.Millisecond)

	// Next request should be allowed (half-open state)
	err := cb.Execute(ctx, func() error {
		return nil
	})

	if err != nil {
		t.Errorf("expected no error in half-open state, got %v", err)
	}

	// After success, circuit should be closed
	if cb.State() != StateClosed {
		t.Errorf("expected circuit breaker to be CLOSED after successful call in half-open, got %s", cb.State())
	}
}

func TestCircuitBreakerReopensOnFailureInHalfOpen(t *testing.T) {
	cb := NewCircuitBreaker("test", 2, 50*time.Millisecond)
	ctx := context.Background()

	testErr := errors.New("test error")

	// Open the circuit
	for i := 0; i < 2; i++ {
		_ = cb.Execute(ctx, func() error {
			return testErr
		})
	}

	// Wait for timeout to transition to half-open
	time.Sleep(60 * time.Millisecond)

	// Fail in half-open state
	_ = cb.Execute(ctx, func() error {
		return testErr
	})

	// Circuit should be open again
	if cb.State() != StateOpen {
		t.Errorf("expected circuit breaker to be OPEN after failure in half-open, got %s", cb.State())
	}
}

func TestCircuitBreakerClosesAfterSuccessInHalfOpen(t *testing.T) {
	cb := NewCircuitBreaker("test", 2, 50*time.Millisecond)
	ctx := context.Background()

	testErr := errors.New("test error")

	// Open the circuit
	for i := 0; i < 2; i++ {
		_ = cb.Execute(ctx, func() error {
			return testErr
		})
	}

	// Wait for timeout
	time.Sleep(60 * time.Millisecond)

	// Succeed in half-open state
	err := cb.Execute(ctx, func() error {
		return nil
	})

	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}

	if cb.State() != StateClosed {
		t.Errorf("expected circuit breaker to be CLOSED, got %s", cb.State())
	}

	if cb.FailureCount() != 0 {
		t.Errorf("expected failure count to be reset to 0, got %d", cb.FailureCount())
	}
}

func TestCircuitBreakerThreadSafety(t *testing.T) {
	cb := NewCircuitBreaker("test", 100, 30*time.Second)
	ctx := context.Background()

	var wg sync.WaitGroup
	numGoroutines := 50
	callsPerGoroutine := 20

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for j := 0; j < callsPerGoroutine; j++ {
				// Alternate between success and failure
				if j%2 == 0 {
					_ = cb.Execute(ctx, func() error {
						return nil
					})
				} else {
					_ = cb.Execute(ctx, func() error {
						return errors.New("test error")
					})
				}
			}
		}(i)
	}

	wg.Wait()

	// Just verify no race conditions or panics occurred
	// The state should be valid
	state := cb.State()
	if state != StateClosed && state != StateOpen && state != StateHalfOpen {
		t.Errorf("expected valid state, got %s", state)
	}
}

func TestCircuitBreakerReset(t *testing.T) {
	cb := NewCircuitBreaker("test", 2, 30*time.Second)
	ctx := context.Background()

	testErr := errors.New("test error")

	// Open the circuit
	for i := 0; i < 2; i++ {
		_ = cb.Execute(ctx, func() error {
			return testErr
		})
	}

	if cb.State() != StateOpen {
		t.Errorf("expected circuit breaker to be OPEN, got %s", cb.State())
	}

	// Reset the circuit breaker
	cb.Reset()

	if cb.State() != StateClosed {
		t.Errorf("expected circuit breaker to be CLOSED after reset, got %s", cb.State())
	}

	if cb.FailureCount() != 0 {
		t.Errorf("expected failure count to be 0 after reset, got %d", cb.FailureCount())
	}
}

func TestCircuitBreakerSuccessfulCallsDoNotIncrementFailures(t *testing.T) {
	cb := NewCircuitBreaker("test", 5, 30*time.Second)
	ctx := context.Background()

	// Make several successful calls
	for i := 0; i < 10; i++ {
		err := cb.Execute(ctx, func() error {
			return nil
		})
		if err != nil {
			t.Errorf("expected no error, got %v", err)
		}
	}

	if cb.FailureCount() != 0 {
		t.Errorf("expected failure count to be 0, got %d", cb.FailureCount())
	}

	if cb.State() != StateClosed {
		t.Errorf("expected circuit breaker to be CLOSED, got %s", cb.State())
	}
}

func TestStateString(t *testing.T) {
	tests := []struct {
		state    State
		expected string
	}{
		{StateClosed, "CLOSED"},
		{StateOpen, "OPEN"},
		{StateHalfOpen, "HALF-OPEN"},
		{State(99), "UNKNOWN"},
	}

	for _, tt := range tests {
		if tt.state.String() != tt.expected {
			t.Errorf("expected %s, got %s", tt.expected, tt.state.String())
		}
	}
}
