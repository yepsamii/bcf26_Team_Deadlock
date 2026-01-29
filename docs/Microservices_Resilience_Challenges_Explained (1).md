# Microservices Resilience Challenges: Detailed Explanation

## Challenge 2: The Vanishing Response (Network Latency)

### The Scenario

**What happens in real life:**

Imagine you're ordering a gaming console online. Behind the scenes:

1. **Order Service** receives your order
2. **Order Service** needs to call **Inventory Service** to check/update stock
3. **Inventory Service** starts processing but takes 10 seconds to respond (network congestion, overloaded database, etc.)
4. **Order Service** is waiting... waiting... waiting...
5. Your browser shows a spinning loader indefinitely
6. You refresh the page, try again, creating duplicate orders

**The Problem:**
- User experience is terrible (page hangs)
- Resources are wasted (connections stay open)
- System can't handle concurrent requests efficiently
- No clear feedback about what went wrong

### Real-World Example Timeline

```
Time 0s:  User clicks "Place Order"
Time 0s:  Order Service receives request
Time 0s:  Order Service calls Inventory Service
Time 5s:  [User is staring at loading spinner]
Time 10s: [Still waiting...]
Time 15s: [User gets frustrated, hits refresh]
Time 20s: [Original request still waiting]
Time 30s: [Connection might timeout eventually, but unclear error]
```

### The Solution: Timeouts + Circuit Breakers + Graceful Degradation

#### Solution 1: Request Timeouts

**Implementation:**
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

type InventoryRequest struct {
    OrderID   string `json:"order_id"`
    ProductID string `json:"product_id"`
    Quantity  int    `json:"quantity"`
}

type InventoryResponse struct {
    Success bool   `json:"success"`
    Error   string `json:"error,omitempty"`
}

func updateInventory(orderID, productID string, quantity int) InventoryResponse {
    // Create HTTP client with 3 second timeout
    client := &http.Client{
        Timeout: 3 * time.Second, // Wait maximum 3 seconds
    }
    
    // Prepare request body
    reqBody := InventoryRequest{
        OrderID:   orderID,
        ProductID: productID,
        Quantity:  quantity,
    }
    
    jsonData, err := json.Marshal(reqBody)
    if err != nil {
        return InventoryResponse{
            Success: false,
            Error:   "Failed to prepare request",
        }
    }
    
    // Make POST request
    url := fmt.Sprintf("%s/update", INVENTORY_SERVICE_URL)
    resp, err := client.Post(url, "application/json", bytes.NewBuffer(jsonData))
    
    if err != nil {
        // Timeout or connection error - don't wait forever, fail fast
        return InventoryResponse{
            Success: false,
            Error:   "Inventory service unavailable. Please try again.",
        }
    }
    defer resp.Body.Close()
    
    // Parse response
    var result InventoryResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return InventoryResponse{
            Success: false,
            Error:   "Invalid response from inventory service",
        }
    }
    
    return result
}
```

**How it solves the problem:**
- ✅ Order Service won't wait indefinitely
- ✅ User gets response within 3 seconds (either success or clear error)
- ✅ Resources (connections, threads) are freed quickly
- ✅ System remains responsive to other requests

#### Solution 2: Circuit Breaker Pattern

**The Concept:**
Think of it like an electrical circuit breaker in your house. When there's an overload, it "trips" and stops electricity flow to prevent damage.

**Three States:**

```
1. CLOSED (Normal Operation)
   └─> Requests flow normally
   └─> If failures reach threshold → OPEN

2. OPEN (Service is Down)
   └─> Don't even try to call the service
   └─> Return error immediately (fail fast)
   └─> After timeout period → HALF-OPEN

3. HALF-OPEN (Testing Recovery)
   └─> Allow limited test requests
   └─> If success → CLOSED
   └─> If failure → OPEN
```

**Implementation:**
```go
package circuitbreaker

import (
    "errors"
    "sync"
    "time"
)

type State int

const (
    StateClosed State = iota
    StateOpen
    StateHalfOpen
)

var (
    ErrCircuitOpen = errors.New("circuit breaker is open")
    ErrTooManyRequests = errors.New("too many requests in half-open state")
)

type CircuitBreaker struct {
    maxFailures      int
    timeout          time.Duration
    failureCount     int
    lastFailureTime  time.Time
    state            State
    mutex            sync.RWMutex
    halfOpenRequests int
    maxHalfOpenReqs  int
}

func NewCircuitBreaker(maxFailures int, timeout time.Duration) *CircuitBreaker {
    return &CircuitBreaker{
        maxFailures:     maxFailures,
        timeout:         timeout,
        state:           StateClosed,
        maxHalfOpenReqs: 1,
    }
}

func (cb *CircuitBreaker) Call(fn func() error) error {
    cb.mutex.Lock()
    
    // Check if we should transition to HALF-OPEN
    if cb.state == StateOpen && time.Since(cb.lastFailureTime) > cb.timeout {
        cb.state = StateHalfOpen
        cb.halfOpenRequests = 0
    }
    
    // Handle OPEN state
    if cb.state == StateOpen {
        cb.mutex.Unlock()
        return ErrCircuitOpen
    }
    
    // Handle HALF-OPEN state
    if cb.state == StateHalfOpen {
        if cb.halfOpenRequests >= cb.maxHalfOpenReqs {
            cb.mutex.Unlock()
            return ErrTooManyRequests
        }
        cb.halfOpenRequests++
    }
    
    cb.mutex.Unlock()
    
    // Execute the function
    err := fn()
    
    cb.mutex.Lock()
    defer cb.mutex.Unlock()
    
    if err != nil {
        cb.onFailure()
        return err
    }
    
    cb.onSuccess()
    return nil
}

func (cb *CircuitBreaker) onFailure() {
    cb.failureCount++
    cb.lastFailureTime = time.Now()
    
    if cb.failureCount >= cb.maxFailures {
        cb.state = StateOpen
    }
}

func (cb *CircuitBreaker) onSuccess() {
    cb.failureCount = 0
    cb.state = StateClosed
}

func (cb *CircuitBreaker) GetState() State {
    cb.mutex.RLock()
    defer cb.mutex.RUnlock()
    return cb.state
}

// Usage Example
var inventoryBreaker = NewCircuitBreaker(
    5,              // Open circuit after 5 failures
    30*time.Second, // Try again after 30 seconds
)

type OrderService struct {
    inventoryURL string
}

func (s *OrderService) callInventoryService(orderID, productID string, quantity int) (InventoryResponse, error) {
    var result InventoryResponse
    
    err := inventoryBreaker.Call(func() error {
        client := &http.Client{Timeout: 3 * time.Second}
        
        reqBody := InventoryRequest{
            OrderID:   orderID,
            ProductID: productID,
            Quantity:  quantity,
        }
        
        jsonData, _ := json.Marshal(reqBody)
        url := fmt.Sprintf("%s/update", s.inventoryURL)
        
        resp, err := client.Post(url, "application/json", bytes.NewBuffer(jsonData))
        if err != nil {
            return err
        }
        defer resp.Body.Close()
        
        if resp.StatusCode != http.StatusOK {
            return fmt.Errorf("inventory service returned status %d", resp.StatusCode)
        }
        
        return json.NewDecoder(resp.Body).Decode(&result)
    })
    
    if err != nil {
        return InventoryResponse{}, err
    }
    
    return result, nil
}

func (s *OrderService) processOrder(orderData map[string]interface{}) map[string]interface{} {
    orderID := orderData["order_id"].(string)
    productID := orderData["product_id"].(string)
    quantity := orderData["quantity"].(int)
    
    result, err := s.callInventoryService(orderID, productID, quantity)
    
    if err != nil {
        if errors.Is(err, ErrCircuitOpen) {
            // Circuit is OPEN - don't even try
            return map[string]interface{}{
                "status":  "degraded",
                "message": "Inventory service is temporarily unavailable. Your order is queued for processing.",
            }
        }
        
        return map[string]interface{}{
            "status":  "error",
            "message": "Failed to update inventory: " + err.Error(),
        }
    }
    
    return map[string]interface{}{
        "status": "success",
        "data":   result,
    }
}
```

**How it solves the problem:**
- ✅ Prevents cascading failures (doesn't hammer failing service)
- ✅ Gives the struggling service time to recover
- ✅ Provides immediate feedback when service is known to be down
- ✅ Automatically detects when service recovers

#### Solution 3: Graceful Degradation

**Concept:** Even if one service is slow/down, provide partial functionality

**Implementation:**
```go
package orderservice

import (
    "errors"
    "time"
)

type Order struct {
    ID               string
    ProductID        string
    Quantity         int
    Status           string
    InventoryUpdated bool
    CreatedAt        time.Time
}

type OrderService struct {
    db               *Database
    inventoryService *InventoryServiceClient
    queue            *MessageQueue
}

func (s *OrderService) placeOrder(orderData map[string]interface{}) map[string]interface{} {
    // Step 1: Create order record (this always works)
    order := &Order{
        ID:               generateOrderID(),
        ProductID:        orderData["product_id"].(string),
        Quantity:         orderData["quantity"].(int),
        Status:           "PENDING",
        InventoryUpdated: false,
        CreatedAt:        time.Now(),
    }
    
    if err := s.db.CreateOrder(order); err != nil {
        return map[string]interface{}{
            "status":  "error",
            "message": "Failed to create order",
        }
    }
    
    // Step 2: Try to update inventory
    ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
    defer cancel()
    
    inventoryResult, err := s.inventoryService.UpdateStock(ctx, order.ID, order.ProductID, order.Quantity)
    
    if err == nil && inventoryResult.Success {
        // Success path
        order.Status = "CONFIRMED"
        order.InventoryUpdated = true
        s.db.UpdateOrder(order)
        
        return map[string]interface{}{
            "order_id": order.ID,
            "status":   "confirmed",
            "message":  "Order placed successfully!",
        }
    }
    
    // Failure path - Inventory service is down, but don't fail the order
    if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, ErrCircuitOpen) {
        order.Status = "PENDING_INVENTORY"
        order.InventoryUpdated = false
        s.db.UpdateOrder(order)
        
        // Queue for later processing
        s.queueForInventoryUpdate(order.ID)
        
        return map[string]interface{}{
            "order_id": order.ID,
            "status":   "pending",
            "message":  "Order received! Inventory update pending.",
        }
    }
    
    // Other errors
    return map[string]interface{}{
        "order_id": order.ID,
        "status":   "error",
        "message":  "Failed to process order: " + err.Error(),
    }
}

func (s *OrderService) queueForInventoryUpdate(orderID string) error {
    message := map[string]interface{}{
        "order_id": orderID,
        "retry_count": 0,
        "queued_at": time.Now(),
    }
    
    return s.queue.Publish("inventory_updates", message)
}

// Background worker to process queued inventory updates
func (s *OrderService) processInventoryQueue() {
    for {
        message, err := s.queue.Consume("inventory_updates")
        if err != nil {
            time.Sleep(1 * time.Second)
            continue
        }
        
        orderID := message["order_id"].(string)
        retryCount := message["retry_count"].(int)
        
        order, err := s.db.GetOrder(orderID)
        if err != nil {
            continue
        }
        
        // Try to update inventory
        ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
        result, err := s.inventoryService.UpdateStock(ctx, order.ID, order.ProductID, order.Quantity)
        cancel()
        
        if err == nil && result.Success {
            // Success! Update order status
            order.Status = "CONFIRMED"
            order.InventoryUpdated = true
            s.db.UpdateOrder(order)
        } else {
            // Still failing, requeue with backoff
            if retryCount < 5 {
                time.Sleep(time.Duration(retryCount*retryCount) * time.Second) // Exponential backoff
                message["retry_count"] = retryCount + 1
                s.queue.Publish("inventory_updates", message)
            } else {
                // Max retries reached, mark as failed
                order.Status = "FAILED"
                s.db.UpdateOrder(order)
                // Alert operations team
                s.alertOps("Order %s failed after max retries", orderID)
            }
        }
    }
}
```

**How it solves the problem:**
- ✅ User's order isn't completely lost
- ✅ System can process the inventory update later (async)
- ✅ Better user experience than total failure
- ✅ Revenue isn't lost due to temporary service issues

### Complete Flow Comparison

**Without Solutions (Bad):**
```
User → Order Service → Inventory Service (slow/down)
                  ↓ (waiting 30+ seconds)
                  ↓ (maybe timeout, maybe not)
                  ↓ (unclear error)
User ← "Something went wrong" (after 30+ seconds)
```

**With Solutions (Good):**
```
User → Order Service → Circuit Breaker Check
                  ↓
            [Is circuit OPEN?]
                  ↓ No
            Call Inventory (timeout=3s)
                  ↓ (timeout after 3s)
            Update circuit breaker
                  ↓
            Queue for later processing
                  ↓
User ← "Order received! Processing..." (within 3 seconds)
```

---

## Challenge 5: Schrödinger's Warehouse (Partial Failures)

### The Scenario

**The Quantum Problem:**

Imagine this sequence of events when shipping a gaming console:

```
Step 1: Order Service → "Ship this order, reduce inventory by 1"
Step 2: Inventory Service receives request
Step 3: Inventory Service updates database: stock = stock - 1 ✅
Step 4: Database commits the change ✅
Step 5: Inventory Service prepares response "Success!"
Step 6: 💥 CRASH! Process dies / Network fails / Server restarts
Step 7: Order Service receives: ERROR 500 / Connection refused / Timeout
```

**The Paradox:**
- **Order Service thinks:** "Failed! Inventory wasn't updated! ❌"
- **Database reality:** "Stock was reduced by 1! ✅"
- **The state:** Both succeeded AND failed (Schrödinger's cat!)

### Real-World Disaster Scenarios

#### Scenario 1: The Double Deduction

```
Timeline:
10:00:00 - Order #1001 placed (10 consoles in stock)
10:00:01 - Inventory Service: stock = 10 - 1 = 9 ✅
10:00:02 - 💥 Service crashes before responding
10:00:03 - Order Service: "Error! Retry!"
10:00:04 - Inventory Service: stock = 9 - 1 = 8 ✅
10:00:05 - Response: "Success!"

Result: Shipped 1 console, deducted 2 from inventory
Lost inventory: 1 console ($500 loss)
```

#### Scenario 2: The Phantom Stock

```
Timeline:
10:00:00 - Order #1002 placed (1 console left)
10:00:01 - Inventory Service: stock = 1 - 1 = 0 ✅
10:00:02 - 💥 Network error
10:00:03 - Order Service: "Error! Show 'Out of Stock' to user"
10:00:04 - User sees: "Sorry, out of stock"

Reality: Console WAS reserved, user gets error message
Lost sale: $500
Angry customer: Priceless
```

#### Scenario 3: The Race Condition

```
Two orders at the same time:

Thread A                          Thread B
10:00:00 Order #1003             10:00:00 Order #1004
10:00:01 Check stock: 1 left     10:00:01 Check stock: 1 left (?!)
10:00:02 Reduce: 1 - 1 = 0       10:00:02 Reduce: 0 - 1 = -1 (!!)
10:00:03 Ship console #1         10:00:03 Ship console #2 (doesn't exist!)

Result: Oversold by 1 console
```

### The Solutions: Ensuring Exactly-Once Semantics

#### Solution 1: Idempotency Keys

**Concept:** Same request with same key = same result, no matter how many times you call it

**Implementation:**

```go
package inventoryservice

import (
    "database/sql"
    "encoding/json"
    "fmt"
    "sync"
    "time"
)

type UpdateRequest struct {
    IdempotencyKey string `json:"idempotency_key"`
    OrderID        string `json:"order_id"`
    ProductID      string `json:"product_id"`
    Quantity       int    `json:"quantity"`
}

type UpdateResponse struct {
    Success  bool   `json:"success"`
    NewStock int    `json:"new_stock"`
    OrderID  string `json:"order_id"`
}

type ProcessedRequest struct {
    Key       string
    Result    UpdateResponse
    Timestamp time.Time
}

type InventoryService struct {
    db                *sql.DB
    processedRequests map[string]UpdateResponse // In production: use Redis
    mutex             sync.RWMutex
}

func NewInventoryService(db *sql.DB) *InventoryService {
    return &InventoryService{
        db:                db,
        processedRequests: make(map[string]UpdateResponse),
    }
}

func (s *InventoryService) UpdateInventory(req UpdateRequest) (UpdateResponse, error) {
    idempotencyKey := req.IdempotencyKey
    
    // Check if we've seen this request before
    s.mutex.RLock()
    if cachedResult, exists := s.processedRequests[idempotencyKey]; exists {
        s.mutex.RUnlock()
        // Return the same result as before
        return cachedResult, nil
    }
    s.mutex.RUnlock()
    
    // Check database for processed request (in case of server restart)
    var storedResult string
    err := s.db.QueryRow(
        "SELECT result FROM processed_requests WHERE key = ?",
        idempotencyKey,
    ).Scan(&storedResult)
    
    if err == nil {
        // Found in database
        var result UpdateResponse
        json.Unmarshal([]byte(storedResult), &result)
        
        // Cache it
        s.mutex.Lock()
        s.processedRequests[idempotencyKey] = result
        s.mutex.Unlock()
        
        return result, nil
    }
    
    // Process the request (first time)
    tx, err := s.db.Begin()
    if err != nil {
        return UpdateResponse{}, fmt.Errorf("failed to begin transaction: %w", err)
    }
    defer tx.Rollback()
    
    // Update inventory
    var currentStock int
    err = tx.QueryRow(
        "SELECT stock FROM products WHERE id = ? FOR UPDATE",
        req.ProductID,
    ).Scan(&currentStock)
    
    if err != nil {
        return UpdateResponse{}, fmt.Errorf("failed to get product: %w", err)
    }
    
    if currentStock < req.Quantity {
        return UpdateResponse{
            Success: false,
            OrderID: req.OrderID,
        }, fmt.Errorf("insufficient stock")
    }
    
    newStock := currentStock - req.Quantity
    _, err = tx.Exec(
        "UPDATE products SET stock = ? WHERE id = ?",
        newStock, req.ProductID,
    )
    
    if err != nil {
        return UpdateResponse{}, fmt.Errorf("failed to update stock: %w", err)
    }
    
    // Create result
    result := UpdateResponse{
        Success:  true,
        NewStock: newStock,
        OrderID:  req.OrderID,
    }
    
    // Store the result with the idempotency key
    resultJSON, _ := json.Marshal(result)
    _, err = tx.Exec(
        "INSERT INTO processed_requests (key, result, timestamp) VALUES (?, ?, ?)",
        idempotencyKey, string(resultJSON), time.Now(),
    )
    
    if err != nil {
        return UpdateResponse{}, fmt.Errorf("failed to store request: %w", err)
    }
    
    // Commit transaction
    if err := tx.Commit(); err != nil {
        return UpdateResponse{}, fmt.Errorf("failed to commit: %w", err)
    }
    
    // Cache the result
    s.mutex.Lock()
    s.processedRequests[idempotencyKey] = result
    s.mutex.Unlock()
    
    return result, nil
}


// Order Service Implementation

type OrderService struct {
    inventoryURL string
    client       *http.Client
}

func (s *OrderService) shipOrder(orderID string) (map[string]interface{}, error) {
    // Generate unique key for this specific operation
    idempotencyKey := fmt.Sprintf("ship_order_%s_%s", orderID, generateUUID())
    
    // Retry with same key
    maxRetries := 3
    var lastErr error
    
    for attempt := 0; attempt < maxRetries; attempt++ {
        req := UpdateRequest{
            IdempotencyKey: idempotencyKey, // Same key for all retries!
            OrderID:        orderID,
            ProductID:      "console_123",
            Quantity:       1,
        }
        
        jsonData, _ := json.Marshal(req)
        
        resp, err := s.client.Post(
            fmt.Sprintf("%s/update", s.inventoryURL),
            "application/json",
            bytes.NewBuffer(jsonData),
        )
        
        if err == nil && resp.StatusCode == http.StatusOK {
            var result UpdateResponse
            json.NewDecoder(resp.Body).Decode(&result)
            resp.Body.Close()
            
            return map[string]interface{}{
                "success":   result.Success,
                "new_stock": result.NewStock,
                "order_id":  result.OrderID,
            }, nil
        }
        
        if err != nil {
            lastErr = err
        } else {
            resp.Body.Close()
            lastErr = fmt.Errorf("HTTP %d", resp.StatusCode)
        }
        
        if attempt < maxRetries-1 {
            // Exponential backoff
            backoff := time.Duration(1<<uint(attempt)) * time.Second
            time.Sleep(backoff)
        }
    }
    
    return nil, fmt.Errorf("failed after %d retries: %w", maxRetries, lastErr)
}

func generateUUID() string {
    // Use google/uuid or implement UUID generation
    return fmt.Sprintf("%d", time.Now().UnixNano())
}
```

**How it solves the problem:**

```
First Attempt:
Order → [Key: abc123] → Inventory → Update DB ✅ → 💥 Crash
Order ← ERROR

Retry (Same Key):
Order → [Key: abc123] → Inventory → "I've seen abc123 before!"
Order ← Return cached result ✅ (no double deduction!)
```

- ✅ Safe to retry (no duplicate operations)
- ✅ Same request = same result (idempotent)
- ✅ Prevents double deductions
- ✅ Prevents lost updates

#### Solution 2: Two-Phase Commit (2PC)

**Concept:** Like a marriage ceremony - both parties must agree before committing

**Phases:**

```
Phase 1: PREPARE (Can you do this?)
  Order Service → Inventory: "Can you reserve 1 console?"
  Inventory → Check, Lock, Reserve → "Yes, I can!" (or "No")
  
Phase 2: COMMIT (Do it!)
  Order Service → Inventory: "Commit the reservation!"
  Inventory → Finalize → "Done!"
  
Or ABORT:
  Order Service → Inventory: "Cancel it!"
  Inventory → Release locks → "Cancelled!"
```

**Implementation:**

```go
package inventoryservice

import (
    "database/sql"
    "fmt"
    "sync"
    "time"
)

type ReservationStatus string

const (
    StatusPrepared  ReservationStatus = "PREPARED"
    StatusCommitted ReservationStatus = "COMMITTED"
    StatusAborted   ReservationStatus = "ABORTED"
)

type Reservation struct {
    TransactionID string
    ProductID     string
    Quantity      int
    Status        ReservationStatus
    ExpiresAt     time.Time
    CreatedAt     time.Time
}

type InventoryTransaction struct {
    db           *sql.DB
    reservations map[string]*Reservation
    mutex        sync.RWMutex
}

func NewInventoryTransaction(db *sql.DB) *InventoryTransaction {
    it := &InventoryTransaction{
        db:           db,
        reservations: make(map[string]*Reservation),
    }
    
    // Start cleanup goroutine for expired reservations
    go it.cleanupExpiredReservations()
    
    return it
}

// Phase 1: PREPARE
func (it *InventoryTransaction) Prepare(transactionID, productID string, quantity int) map[string]interface{} {
    tx, err := it.db.Begin()
    if err != nil {
        return map[string]interface{}{
            "vote":   "ABORT",
            "reason": "database_error",
        }
    }
    defer tx.Rollback()
    
    // Check if enough stock (with row lock)
    var currentStock int
    err = tx.QueryRow(
        "SELECT stock FROM products WHERE id = ? FOR UPDATE",
        productID,
    ).Scan(&currentStock)
    
    if err != nil {
        return map[string]interface{}{
            "vote":   "ABORT",
            "reason": "product_not_found",
        }
    }
    
    if currentStock < quantity {
        return map[string]interface{}{
            "vote":   "ABORT",
            "reason": "insufficient_stock",
        }
    }
    
    // Create a reservation (lock the stock)
    reservation := &Reservation{
        TransactionID: transactionID,
        ProductID:     productID,
        Quantity:      quantity,
        Status:        StatusPrepared,
        ExpiresAt:     time.Now().Add(5 * time.Minute),
        CreatedAt:     time.Now(),
    }
    
    _, err = tx.Exec(`
        INSERT INTO reservations (transaction_id, product_id, quantity, status, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`,
        reservation.TransactionID,
        reservation.ProductID,
        reservation.Quantity,
        reservation.Status,
        reservation.ExpiresAt,
        reservation.CreatedAt,
    )
    
    if err != nil {
        return map[string]interface{}{
            "vote":   "ABORT",
            "reason": "reservation_failed",
        }
    }
    
    if err := tx.Commit(); err != nil {
        return map[string]interface{}{
            "vote":   "ABORT",
            "reason": "commit_failed",
        }
    }
    
    // Store in memory
    it.mutex.Lock()
    it.reservations[transactionID] = reservation
    it.mutex.Unlock()
    
    return map[string]interface{}{
        "vote": "COMMIT",
    }
}

// Phase 2: COMMIT
func (it *InventoryTransaction) Commit(transactionID string) map[string]interface{} {
    it.mutex.RLock()
    reservation, exists := it.reservations[transactionID]
    it.mutex.RUnlock()
    
    if !exists {
        // Check database
        var r Reservation
        err := it.db.QueryRow(`
            SELECT transaction_id, product_id, quantity, status, expires_at
            FROM reservations WHERE transaction_id = ?`,
            transactionID,
        ).Scan(&r.TransactionID, &r.ProductID, &r.Quantity, &r.Status, &r.ExpiresAt)
        
        if err != nil {
            return map[string]interface{}{
                "error": "transaction_not_found",
            }
        }
        reservation = &r
    }
    
    tx, err := it.db.Begin()
    if err != nil {
        return map[string]interface{}{
            "error": "database_error",
        }
    }
    defer tx.Rollback()
    
    // Actually deduct the stock
    _, err = tx.Exec(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        reservation.Quantity,
        reservation.ProductID,
    )
    
    if err != nil {
        return map[string]interface{}{
            "error": "stock_update_failed",
        }
    }
    
    // Update reservation status
    _, err = tx.Exec(
        "UPDATE reservations SET status = ? WHERE transaction_id = ?",
        StatusCommitted,
        transactionID,
    )
    
    if err != nil {
        return map[string]interface{}{
            "error": "reservation_update_failed",
        }
    }
    
    if err := tx.Commit(); err != nil {
        return map[string]interface{}{
            "error": "commit_failed",
        }
    }
    
    // Update memory
    it.mutex.Lock()
    if res, exists := it.reservations[transactionID]; exists {
        res.Status = StatusCommitted
    }
    it.mutex.Unlock()
    
    return map[string]interface{}{
        "success": true,
    }
}

// Phase 2: ABORT
func (it *InventoryTransaction) Abort(transactionID string) map[string]interface{} {
    _, err := it.db.Exec(
        "UPDATE reservations SET status = ? WHERE transaction_id = ?",
        StatusAborted,
        transactionID,
    )
    
    if err != nil {
        return map[string]interface{}{
            "error": "abort_failed",
        }
    }
    
    // Update memory
    it.mutex.Lock()
    if res, exists := it.reservations[transactionID]; exists {
        res.Status = StatusAborted
        delete(it.reservations, transactionID)
    }
    it.mutex.Unlock()
    
    return map[string]interface{}{
        "success": true,
    }
}

func (it *InventoryTransaction) cleanupExpiredReservations() {
    ticker := time.NewTicker(1 * time.Minute)
    defer ticker.Stop()
    
    for range ticker.C {
        // Delete expired PREPARED reservations
        _, err := it.db.Exec(`
            DELETE FROM reservations 
            WHERE status = ? AND expires_at < ?`,
            StatusPrepared,
            time.Now(),
        )
        
        if err != nil {
            fmt.Printf("Failed to cleanup expired reservations: %v\n", err)
        }
    }
}


// Order Service (Coordinator)

type OrderCoordinator struct {
    inventoryURL string
    client       *http.Client
}

func (oc *OrderCoordinator) shipOrder2PC(orderID, productID string, quantity int) (map[string]interface{}, error) {
    transactionID := fmt.Sprintf("txn_%s", generateUUID())
    
    // PHASE 1: PREPARE
    prepareReq := map[string]interface{}{
        "transaction_id": transactionID,
        "product_id":     productID,
        "quantity":       quantity,
    }
    
    prepareResp, err := oc.postJSON(oc.inventoryURL+"/prepare", prepareReq)
    if err != nil {
        return nil, fmt.Errorf("prepare request failed: %w", err)
    }
    
    if prepareResp["vote"] == "ABORT" {
        return map[string]interface{}{
            "error":  "Cannot fulfill order",
            "reason": prepareResp["reason"],
        }, nil
    }
    
    // PHASE 2: COMMIT
    commitReq := map[string]interface{}{
        "transaction_id": transactionID,
    }
    
    commitResp, err := oc.postJSON(oc.inventoryURL+"/commit", commitReq)
    if err != nil {
        // If commit fails, try to abort
        abortReq := map[string]interface{}{
            "transaction_id": transactionID,
        }
        oc.postJSON(oc.inventoryURL+"/abort", abortReq)
        return nil, fmt.Errorf("commit failed: %w", err)
    }
    
    return map[string]interface{}{
        "success":        true,
        "transaction_id": transactionID,
    }, nil
}

func (oc *OrderCoordinator) postJSON(url string, data map[string]interface{}) (map[string]interface{}, error) {
    jsonData, _ := json.Marshal(data)
    
    resp, err := oc.client.Post(url, "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var result map[string]interface{}
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    
    return result, nil
}
```

**How it solves the problem:**

```
Scenario: Crash between prepare and commit

Time 0: Prepare → Reserve 1 console ✅
Time 1: 💥 Order Service crashes
Time 5min: Reservation expires automatically ✅
Result: No stock lost, reservation freed
```

- ✅ Stock is locked (reserved) not deducted during prepare
- ✅ If crash happens, reservation expires (no permanent lock)
- ✅ All participants must agree before committing
- ✅ Atomic operation across services

#### Solution 3: Saga Pattern (Distributed Transactions)

**Concept:** Chain of local transactions with compensating actions

**Two Types:**

**3a. Choreography (Event-Driven)**

```go
package saga

import (
    "encoding/json"
    "fmt"
)

// Event Bus interface
type EventBus interface {
    Publish(topic string, event interface{}) error
    Subscribe(topic string, handler func(event map[string]interface{}))
}

// Order Service
type OrderService struct {
    db       *Database
    eventBus EventBus
}

func (s *OrderService) placeOrder(orderData map[string]interface{}) *Order {
    order := &Order{
        ID:        generateOrderID(),
        ProductID: orderData["product_id"].(string),
        Quantity:  orderData["quantity"].(int),
        Status:    "PENDING",
        CreatedAt: time.Now(),
    }
    
    s.db.CreateOrder(order)
    
    // Publish event
    event := map[string]interface{}{
        "order_id":   order.ID,
        "product_id": order.ProductID,
        "quantity":   order.Quantity,
    }
    
    s.eventBus.Publish("OrderCreated", event)
    
    return order
}

func (s *OrderService) setupEventListeners() {
    // Listen for inventory update success
    s.eventBus.Subscribe("InventoryUpdated", func(event map[string]interface{}) {
        orderID := event["order_id"].(string)
        success := event["success"].(bool)
        
        if success {
            order, _ := s.db.GetOrder(orderID)
            order.Status = "CONFIRMED"
            s.db.UpdateOrder(order)
        }
    })
    
    // Listen for inventory update failure
    s.eventBus.Subscribe("InventoryUpdateFailed", func(event map[string]interface{}) {
        orderID := event["order_id"].(string)
        reason := event["reason"].(string)
        
        order, _ := s.db.GetOrder(orderID)
        order.Status = "CANCELLED"
        order.CancellationReason = reason
        s.db.UpdateOrder(order)
    })
}


// Inventory Service
type InventoryService struct {
    db       *Database
    eventBus EventBus
}

func (s *InventoryService) setupEventListeners() {
    // Listen to OrderCreated events
    s.eventBus.Subscribe("OrderCreated", func(event map[string]interface{}) {
        orderID := event["order_id"].(string)
        productID := event["product_id"].(string)
        quantity := int(event["quantity"].(float64))
        
        s.handleOrderCreated(orderID, productID, quantity)
    })
}

func (s *InventoryService) handleOrderCreated(orderID, productID string, quantity int) {
    tx, err := s.db.Begin()
    if err != nil {
        s.publishFailure(orderID, "database_error")
        return
    }
    defer tx.Rollback()
    
    // Get current stock with lock
    var currentStock int
    err = tx.QueryRow(
        "SELECT stock FROM products WHERE id = ? FOR UPDATE",
        productID,
    ).Scan(&currentStock)
    
    if err != nil {
        s.publishFailure(orderID, "product_not_found")
        return
    }
    
    if currentStock < quantity {
        s.publishFailure(orderID, "insufficient_stock")
        return
    }
    
    // Update stock
    _, err = tx.Exec(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        quantity, productID,
    )
    
    if err != nil {
        s.publishFailure(orderID, "update_failed")
        return
    }
    
    if err := tx.Commit(); err != nil {
        s.publishFailure(orderID, "commit_failed")
        return
    }
    
    // Publish success
    s.publishSuccess(orderID)
}

func (s *InventoryService) publishSuccess(orderID string) {
    event := map[string]interface{}{
        "order_id": orderID,
        "success":  true,
    }
    s.eventBus.Publish("InventoryUpdated", event)
}

func (s *InventoryService) publishFailure(orderID, reason string) {
    event := map[string]interface{}{
        "order_id": orderID,
        "reason":   reason,
    }
    s.eventBus.Publish("InventoryUpdateFailed", event)
}


// Example Event Bus implementation using channels
type SimpleEventBus struct {
    subscribers map[string][]func(map[string]interface{})
    mutex       sync.RWMutex
}

func NewSimpleEventBus() *SimpleEventBus {
    return &SimpleEventBus{
        subscribers: make(map[string][]func(map[string]interface{})),
    }
}

func (eb *SimpleEventBus) Publish(topic string, event interface{}) error {
    eb.mutex.RLock()
    handlers, exists := eb.subscribers[topic]
    eb.mutex.RUnlock()
    
    if !exists {
        return nil
    }
    
    // Convert event to map
    eventData, _ := json.Marshal(event)
    var eventMap map[string]interface{}
    json.Unmarshal(eventData, &eventMap)
    
    // Call all handlers asynchronously
    for _, handler := range handlers {
        go handler(eventMap)
    }
    
    return nil
}

func (eb *SimpleEventBus) Subscribe(topic string, handler func(map[string]interface{})) {
    eb.mutex.Lock()
    defer eb.mutex.Unlock()
    
    eb.subscribers[topic] = append(eb.subscribers[topic], handler)
}
```

**3b. Orchestration (Central Coordinator)**

```go
package saga

import (
    "fmt"
    "time"
)

type SagaState string

const (
    StateStarted   SagaState = "STARTED"
    StateCompleted SagaState = "COMPLETED"
    StateFailed    SagaState = "FAILED"
)

type CompensatingAction func() error

type OrderSaga struct {
    orderID           string
    state             SagaState
    compensationStack []CompensatingAction
    db                *Database
    inventoryService  *InventoryServiceClient
    paymentService    *PaymentServiceClient
}

func NewOrderSaga(orderID string) *OrderSaga {
    return &OrderSaga{
        orderID:           orderID,
        state:             StateStarted,
        compensationStack: make([]CompensatingAction, 0),
    }
}

func (s *OrderSaga) Execute() (map[string]interface{}, error) {
    var err error
    
    // Step 1: Create order
    if err = s.createOrder(); err != nil {
        return s.handleFailure(err)
    }
    s.compensationStack = append(s.compensationStack, s.cancelOrder)
    
    // Step 2: Reserve inventory
    if err = s.reserveInventory(); err != nil {
        return s.handleFailure(err)
    }
    s.compensationStack = append(s.compensationStack, s.releaseInventory)
    
    // Step 3: Process payment
    if err = s.processPayment(); err != nil {
        return s.handleFailure(err)
    }
    s.compensationStack = append(s.compensationStack, s.refundPayment)
    
    // Step 4: Update inventory (finalize)
    if err = s.updateInventory(); err != nil {
        return s.handleFailure(err)
    }
    
    s.state = StateCompleted
    return map[string]interface{}{
        "success": true,
        "state":   s.state,
    }, nil
}

func (s *OrderSaga) handleFailure(err error) (map[string]interface{}, error) {
    // Rollback: execute compensating actions in reverse
    s.compensate()
    s.state = StateFailed
    
    return map[string]interface{}{
        "success": false,
        "error":   err.Error(),
        "state":   s.state,
    }, err
}

func (s *OrderSaga) compensate() {
    // Execute compensating transactions in reverse order
    for i := len(s.compensationStack) - 1; i >= 0; i-- {
        compensatingAction := s.compensationStack[i]
        
        if err := compensatingAction(); err != nil {
            // Log but continue compensating
            fmt.Printf("Compensation failed for step %d: %v\n", i, err)
            // In production: alert operations team
        }
    }
}

// Forward actions
func (s *OrderSaga) createOrder() error {
    order := &Order{
        ID:        s.orderID,
        Status:    "PENDING",
        CreatedAt: time.Now(),
    }
    
    return s.db.CreateOrder(order)
}

func (s *OrderSaga) reserveInventory() error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    response, err := s.inventoryService.Reserve(ctx, s.orderID)
    if err != nil {
        return fmt.Errorf("inventory reservation failed: %w", err)
    }
    
    if !response.Success {
        return fmt.Errorf("inventory reservation rejected: %s", response.Reason)
    }
    
    return nil
}

func (s *OrderSaga) processPayment() error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    response, err := s.paymentService.Charge(ctx, s.orderID)
    if err != nil {
        return fmt.Errorf("payment processing failed: %w", err)
    }
    
    if !response.Success {
        return fmt.Errorf("payment rejected: %s", response.Reason)
    }
    
    return nil
}

func (s *OrderSaga) updateInventory() error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    response, err := s.inventoryService.Commit(ctx, s.orderID)
    if err != nil {
        return fmt.Errorf("inventory update failed: %w", err)
    }
    
    if !response.Success {
        return fmt.Errorf("inventory update rejected: %s", response.Reason)
    }
    
    return nil
}

// Compensating actions
func (s *OrderSaga) cancelOrder() error {
    order, err := s.db.GetOrder(s.orderID)
    if err != nil {
        return err
    }
    
    order.Status = "CANCELLED"
    return s.db.UpdateOrder(order)
}

func (s *OrderSaga) releaseInventory() error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    _, err := s.inventoryService.ReleaseReservation(ctx, s.orderID)
    return err
}

func (s *OrderSaga) refundPayment() error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    _, err := s.paymentService.Refund(ctx, s.orderID)
    return err
}


// Order Service usage
type OrderOrchestrator struct {
    db               *Database
    inventoryService *InventoryServiceClient
    paymentService   *PaymentServiceClient
}

func (o *OrderOrchestrator) PlaceOrder(orderData map[string]interface{}) (map[string]interface{}, error) {
    orderID := generateOrderID()
    
    saga := &OrderSaga{
        orderID:          orderID,
        db:               o.db,
        inventoryService: o.inventoryService,
        paymentService:   o.paymentService,
    }
    
    return saga.Execute()
}
```

**How it solves the problem:**

```
Success Path:
1. Create Order ✅
2. Reserve Inventory ✅
3. Process Payment ✅
4. Update Inventory ✅
Result: Success!

Failure Path:
1. Create Order ✅
2. Reserve Inventory ✅
3. Process Payment 💥 FAILS
4. Compensate:
   - Refund Payment (N/A)
   - Release Inventory ✅
   - Cancel Order ✅
Result: Rolled back cleanly!
```

- ✅ Each step is a local transaction (simpler than 2PC)
- ✅ Compensating actions undo previous steps
- ✅ More flexible than 2PC
- ✅ Better for long-running workflows

#### Solution 4: Event Sourcing + CQRS

**Concept:** Store events, not state. Replay events to rebuild state.

**Implementation:**

```go
package eventsourcing

import (
    "database/sql"
    "encoding/json"
    "fmt"
    "time"
)

// Event Store
type Event struct {
    ID           int64
    AggregateID  string
    EventType    string
    EventData    json.RawMessage
    Timestamp    time.Time
    Sequence     int
}

type EventStore struct {
    db *sql.DB
}

func NewEventStore(db *sql.DB) *EventStore {
    return &EventStore{db: db}
}

func (es *EventStore) Append(aggregateID string, event map[string]interface{}) error {
    eventType := event["type"].(string)
    eventData, err := json.Marshal(event["data"])
    if err != nil {
        return err
    }
    
    sequence := es.getNextSequence(aggregateID)
    
    _, err = es.db.Exec(`
        INSERT INTO events (aggregate_id, event_type, event_data, timestamp, sequence)
        VALUES (?, ?, ?, ?, ?)`,
        aggregateID,
        eventType,
        eventData,
        time.Now(),
        sequence,
    )
    
    return err
}

func (es *EventStore) GetEvents(aggregateID string) ([]Event, error) {
    rows, err := es.db.Query(`
        SELECT id, aggregate_id, event_type, event_data, timestamp, sequence
        FROM events
        WHERE aggregate_id = ?
        ORDER BY sequence ASC`,
        aggregateID,
    )
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var events []Event
    for rows.Next() {
        var e Event
        err := rows.Scan(
            &e.ID,
            &e.AggregateID,
            &e.EventType,
            &e.EventData,
            &e.Timestamp,
            &e.Sequence,
        )
        if err != nil {
            return nil, err
        }
        events = append(events, e)
    }
    
    return events, nil
}

func (es *EventStore) getNextSequence(aggregateID string) int {
    var maxSeq sql.NullInt64
    es.db.QueryRow(`
        SELECT MAX(sequence) FROM events WHERE aggregate_id = ?`,
        aggregateID,
    ).Scan(&maxSeq)
    
    if maxSeq.Valid {
        return int(maxSeq.Int64) + 1
    }
    return 0
}


// Inventory Aggregate
type InventoryAggregate struct {
    ProductID string
    Stock     int
    Version   int
    Changes   []map[string]interface{}
    eventStore *EventStore
}

func NewInventoryAggregate(productID string, eventStore *EventStore) *InventoryAggregate {
    return &InventoryAggregate{
        ProductID:  productID,
        Stock:      0,
        Version:    0,
        Changes:    make([]map[string]interface{}, 0),
        eventStore: eventStore,
    }
}

// Command: reduce stock
func (ia *InventoryAggregate) ReduceStock(orderID string, quantity int) error {
    if ia.Stock < quantity {
        return fmt.Errorf("insufficient stock: have %d, need %d", ia.Stock, quantity)
    }
    
    // Create event
    event := map[string]interface{}{
        "type": "StockReduced",
        "data": map[string]interface{}{
            "order_id":  orderID,
            "quantity":  quantity,
            "timestamp": time.Now(),
        },
    }
    
    // Apply event to update state
    ia.apply(event)
    ia.Changes = append(ia.Changes, event)
    
    return nil
}

// Command: add stock
func (ia *InventoryAggregate) AddStock(quantity int, reason string) {
    event := map[string]interface{}{
        "type": "StockAdded",
        "data": map[string]interface{}{
            "quantity":  quantity,
            "reason":    reason,
            "timestamp": time.Now(),
        },
    }
    
    ia.apply(event)
    ia.Changes = append(ia.Changes, event)
}

// Apply event to update state
func (ia *InventoryAggregate) apply(event map[string]interface{}) {
    eventType := event["type"].(string)
    data := event["data"].(map[string]interface{})
    
    switch eventType {
    case "StockReduced":
        quantity := int(data["quantity"].(float64))
        ia.Stock -= quantity
        ia.Version++
        
    case "StockAdded":
        quantity := int(data["quantity"].(float64))
        ia.Stock += quantity
        ia.Version++
    }
}

// Persist events
func (ia *InventoryAggregate) Save() error {
    for _, event := range ia.Changes {
        if err := ia.eventStore.Append(ia.ProductID, event); err != nil {
            return err
        }
    }
    ia.Changes = make([]map[string]interface{}, 0)
    return nil
}

// Rebuild state from events
func LoadInventoryAggregate(productID string, eventStore *EventStore) (*InventoryAggregate, error) {
    aggregate := NewInventoryAggregate(productID, eventStore)
    
    events, err := eventStore.GetEvents(productID)
    if err != nil {
        return nil, err
    }
    
    for _, event := range events {
        var data map[string]interface{}
        json.Unmarshal(event.EventData, &data)
        
        eventMap := map[string]interface{}{
            "type": event.EventType,
            "data": data,
        }
        
        aggregate.apply(eventMap)
    }
    
    return aggregate, nil
}


// Usage in Inventory Service
type InventoryServiceES struct {
    eventStore *EventStore
}

func (s *InventoryServiceES) UpdateInventory(orderID, productID string, quantity int) (map[string]interface{}, error) {
    // Load current state from events
    inventory, err := LoadInventoryAggregate(productID, s.eventStore)
    if err != nil {
        return nil, fmt.Errorf("failed to load aggregate: %w", err)
    }
    
    // Execute command (generates event)
    if err := inventory.ReduceStock(orderID, quantity); err != nil {
        return nil, err
    }
    
    // Save events (this is the commit point)
    if err := inventory.Save(); err != nil {
        return nil, fmt.Errorf("failed to save events: %w", err)
    }
    
    return map[string]interface{}{
        "success":   true,
        "new_stock": inventory.Stock,
        "order_id":  orderID,
    }, nil
}

// Idempotency with Event Sourcing
func (s *InventoryServiceES) UpdateInventoryIdempotent(
    idempotencyKey, orderID, productID string,
    quantity int,
) (map[string]interface{}, error) {
    // Check if event with this idempotency key already exists
    exists, err := s.eventExists(productID, idempotencyKey)
    if err != nil {
        return nil, err
    }
    
    if exists {
        // Event already processed, return cached result
        return s.getCachedResult(idempotencyKey), nil
    }
    
    // Load aggregate
    inventory, err := LoadInventoryAggregate(productID, s.eventStore)
    if err != nil {
        return nil, err
    }
    
    // Execute command
    if err := inventory.ReduceStock(orderID, quantity); err != nil {
        return nil, err
    }
    
    // Add idempotency key to event metadata
    for i := range inventory.Changes {
        if data, ok := inventory.Changes[i]["data"].(map[string]interface{}); ok {
            data["idempotency_key"] = idempotencyKey
        }
    }
    
    // Save events
    if err := inventory.Save(); err != nil {
        return nil, err
    }
    
    result := map[string]interface{}{
        "success":   true,
        "new_stock": inventory.Stock,
        "order_id":  orderID,
    }
    
    // Cache result
    s.cacheResult(idempotencyKey, result)
    
    return result, nil
}

func (s *InventoryServiceES) eventExists(productID, idempotencyKey string) (bool, error) {
    var count int
    err := s.eventStore.db.QueryRow(`
        SELECT COUNT(*) FROM events
        WHERE aggregate_id = ?
        AND JSON_EXTRACT(event_data, '$.idempotency_key') = ?`,
        productID, idempotencyKey,
    ).Scan(&count)
    
    return count > 0, err
}

func (s *InventoryServiceES) getCachedResult(idempotencyKey string) map[string]interface{} {
    // Implementation depends on cache system (Redis, etc.)
    return map[string]interface{}{"cached": true}
}

func (s *InventoryServiceES) cacheResult(idempotencyKey string, result map[string]interface{}) {
    // Implementation depends on cache system (Redis, etc.)
}
```

**How it solves the problem:**

```
Traditional:
  Update stock = 10 → 9
  💥 Crash
  Lost: Did we update or not?

Event Sourcing:
  Event 1: StockAdded(10) ✅
  Event 2: StockReduced(1) ✅
  💥 Crash before response
  Replay events: 10 - 1 = 9 ✅
  State is always recoverable!
  
Retry with same event:
  Check: Event 2 already exists?
  Yes → Skip (idempotent)
  No → Append (execute)
```

- ✅ Complete audit trail (every change recorded)
- ✅ State can always be rebuilt from events
- ✅ Natural idempotency (events have unique IDs)
- ✅ Time travel debugging (replay to any point)
- ✅ Multiple read models (CQRS)

---

## Comparison of Solutions

### For Challenge 2 (Latency):

| Solution | Best For | Complexity | Benefit |
|----------|----------|------------|---------|
| Timeouts | All cases | Low | Prevents hanging |
| Circuit Breaker | High-traffic systems | Medium | Prevents cascading failures |
| Graceful Degradation | User-facing apps | Medium | Better UX during failures |

**Recommended:** Use all three together!

### For Challenge 5 (Partial Failures):

| Solution | Best For | Complexity | Tradeoff |
|----------|----------|------------|----------|
| Idempotency Keys | Simple APIs | Low | Requires client to generate keys |
| Two-Phase Commit | Strong consistency needed | High | Performance overhead, blocking |
| Saga Pattern | Complex workflows | Medium | Eventual consistency |
| Event Sourcing | Audit requirements | High | Storage overhead, learning curve |

**Recommended for this challenge:**
- Start with **Idempotency Keys** (simplest, solves 80% of problems)
- Add **Saga Pattern** if you have multi-step workflows
- Consider **Event Sourcing** if you need audit trails

---

## Testing These Solutions

### Test Scenario 1: Simulate Latency

```go
package inventoryservice

import (
    "math/rand"
    "time"
)

// In Inventory Service - add artificial delay
func (s *InventoryService) updateInventoryWithGremlin(req UpdateRequest) (UpdateResponse, error) {
    // Gremlin: 30% of requests are slow
    if rand.Float64() < 0.3 {
        delay := 5.0 + rand.Float64()*5.0 // 5-10 second delay
        fmt.Printf("🔥 Gremlin activated! Delaying %.2fs\n", delay)
        time.Sleep(time.Duration(delay * float64(time.Second)))
    }
    
    // Normal processing
    return s.actualUpdateInventory(req)
}
```

### Test Scenario 2: Simulate Crashes

```go
package inventoryservice

import (
    "math/rand"
    "os"
)

// In Inventory Service - simulate crash after DB commit
func (s *InventoryService) updateInventoryWithCrashGremlin(req UpdateRequest) (UpdateResponse, error) {
    // Process the request
    tx, _ := s.db.Begin()
    
    var currentStock int
    tx.QueryRow("SELECT stock FROM products WHERE id = ? FOR UPDATE", req.ProductID).Scan(&currentStock)
    
    newStock := currentStock - req.Quantity
    tx.Exec("UPDATE products SET stock = ? WHERE id = ?", newStock, req.ProductID)
    
    // ✅ Database committed!
    tx.Commit()
    
    // Gremlin: 20% chance to crash before response
    if rand.Float64() < 0.2 {
        fmt.Println("💥 Gremlin activated! Crashing...")
        os.Exit(1) // Immediate crash (simulates service death)
    }
    
    return UpdateResponse{
        Success:  true,
        NewStock: newStock,
        OrderID:  req.OrderID,
    }, nil
}
```

### Test Scenario 3: Simulate Network Failures

```go
package inventoryservice

import (
    "errors"
    "math/rand"
    "net/http"
)

// In Inventory Service - simulate connection drops
func (s *InventoryService) updateInventoryWithNetworkGremlin(req UpdateRequest) (UpdateResponse, error) {
    // Process the request
    result, err := s.actualUpdateInventory(req)
    if err != nil {
        return UpdateResponse{}, err
    }
    
    // Gremlin: 10% chance to simulate network failure
    if rand.Float64() < 0.1 {
        fmt.Println("🌐 Gremlin activated! Network failure...")
        return UpdateResponse{}, errors.New("connection lost")
    }
    
    return result, nil
}

// HTTP Handler version
func (s *InventoryService) updateInventoryHTTPHandler(w http.ResponseWriter, r *http.Request) {
    var req UpdateRequest
    json.NewDecoder(r.Body).Decode(&req)
    
    result, err := s.actualUpdateInventory(req)
    
    // Gremlin: simulate network failure before response
    if rand.Float64() < 0.1 {
        fmt.Println("🌐 Gremlin activated! Connection dropped...")
        // Don't send any response - simulate connection drop
        return
    }
    
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    json.NewEncoder(w).Encode(result)
}
```

### Verification Test Suite

```go
package orderservice_test

import (
    "testing"
    "time"
)

func TestOrderServiceResilience(t *testing.T) {
    t.Run("Timeout handling", func(t *testing.T) {
        // Mock inventory service with 10-second delay
        mockInventory := &MockInventoryService{
            DelaySeconds: 10,
        }
        
        orderService := NewOrderService(mockInventory)
        
        start := time.Now()
        response := orderService.ShipOrder("123")
        elapsed := time.Since(start)
        
        // Should complete in < 5 seconds (with 3s timeout)
        if elapsed.Seconds() >= 5 {
            t.Errorf("Expected timeout, took %.2fs", elapsed.Seconds())
        }
        
        // Should return error or pending status
        if response.Status != "pending" && response.Status != "error" {
            t.Errorf("Expected pending/error, got %s", response.Status)
        }
        
        // Should have a message
        if response.Message == "" {
            t.Error("Expected error message")
        }
    })
    
    t.Run("Circuit breaker", func(t *testing.T) {
        mockInventory := &MockInventoryService{
            AlwaysFail: true,
        }
        
        orderService := NewOrderService(mockInventory)
        
        // Simulate 5 consecutive failures
        for i := 0; i < 5; i++ {
            orderService.ShipOrder(fmt.Sprintf("order_%d", i))
        }
        
        // Circuit should be OPEN now
        response := orderService.ShipOrder("999")
        
        if response.Status != "degraded" {
            t.Errorf("Expected degraded status, got %s", response.Status)
        }
        
        if !strings.Contains(strings.ToLower(response.Message), "temporarily unavailable") {
            t.Errorf("Expected 'temporarily unavailable' message, got %s", response.Message)
        }
    })
    
    t.Run("Idempotency", func(t *testing.T) {
        inventoryService := NewInventoryService(db)
        
        key := "test_key_123"
        req := UpdateRequest{
            IdempotencyKey: key,
            OrderID:        "order_1",
            ProductID:      "console_123",
            Quantity:       1,
        }
        
        // First call
        result1, _ := inventoryService.UpdateInventory(req)
        
        // Second call with same key
        result2, _ := inventoryService.UpdateInventory(req)
        
        // Results should be identical
        if result1.NewStock != result2.NewStock {
            t.Error("Idempotency violated: different results")
        }
    })
    
    t.Run("No double deduction", func(t *testing.T) {
        inventoryService := NewInventoryService(db)
        orderService := NewOrderService(inventoryService)
        
        // Set initial stock
        setStock("console_123", 10)
        
        initialStock := getStock("console_123")
        
        // Ship order with retries (simulating failures)
        orderService.ShipOrderWithRetries("456")
        
        finalStock := getStock("console_123")
        
        // Should only deduct once
        if initialStock-finalStock != 1 {
            t.Errorf("Expected stock reduction of 1, got %d", initialStock-finalStock)
        }
    })
}

// Mock services for testing
type MockInventoryService struct {
    DelaySeconds int
    AlwaysFail   bool
}

func (m *MockInventoryService) UpdateStock(ctx context.Context, orderID, productID string, quantity int) (InventoryResponse, error) {
    if m.DelaySeconds > 0 {
        time.Sleep(time.Duration(m.DelaySeconds) * time.Second)
    }
    
    if m.AlwaysFail {
        return InventoryResponse{}, errors.New("service unavailable")
    }
    
    return InventoryResponse{
        Success:  true,
        NewStock: 9,
        OrderID:  orderID,
    }, nil
}

func setStock(productID string, quantity int) {
    db.Exec("UPDATE products SET stock = ? WHERE id = ?", quantity, productID)
}

func getStock(productID string) int {
    var stock int
    db.QueryRow("SELECT stock FROM products WHERE id = ?", productID).Scan(&stock)
    return stock
}
```

---

## Summary

### Challenge 2: The Vanishing Response

**Problem:** Services are slow/unresponsive
**Impact:** Poor UX, resource waste, system hangs

**Solutions:**
1. **Timeouts** → Don't wait forever
2. **Circuit Breakers** → Stop calling failing services
3. **Graceful Degradation** → Provide partial functionality

**Result:** ✅ System remains responsive even when dependencies fail

### Challenge 5: Schrödinger's Warehouse

**Problem:** Service commits to DB but crashes before responding
**Impact:** Duplicate operations, inconsistent state, lost sales

**Solutions:**
1. **Idempotency Keys** → Safe retries
2. **Two-Phase Commit** → Atomic distributed transactions
3. **Saga Pattern** → Compensating transactions
4. **Event Sourcing** → Immutable event log

**Result:** ✅ Exactly-once semantics, no duplicate deductions, consistent state

---

## Key Takeaway

**Distributed systems will fail.** The question is not *if*, but *when* and *how*.

Your job is to:
- ✅ Expect failures
- ✅ Handle them gracefully
- ✅ Provide clear feedback
- ✅ Maintain data consistency
- ✅ Never leave the system in an unknown state

These patterns are battle-tested by companies like Amazon, Netflix, and Uber. They work because they embrace failure as a normal part of distributed systems.
