# Coding Agent Prompt: Valerix Microservices Platform

## CONTEXT
You are building a minimal microservices e-commerce system for **Valerix** that must be completed in **2 hours**. The system must demonstrate fault tolerance, graceful degradation, and observability.

## EXISTING INFRASTRUCTURE
I already have these monitoring services configured in docker-compose.yml:
- Prometheus (port 9090)
- Grafana (port 3030)
- Jaeger (port 16686)
- Loki + Promtail for logs
- OpenTelemetry Collector

## YOUR TASK
Build 3 Go microservices with the following specifications:

---

### SERVICE 1: Order Service (Port 5001)

**Endpoints:**
- `GET /health` - Returns service health + checks if Inventory and Payment services are reachable
- `POST /orders` - Creates order, calls Inventory to reserve stock, calls Payment to process
- `GET /orders/:id` - Returns order details

**Critical Requirements:**
1. HTTP client timeout of **2 seconds** for all downstream calls
2. **Graceful degradation**: If Inventory/Payment times out, don't crash. Instead:
   - Save order with status `PENDING_INVENTORY` or `PENDING_PAYMENT`
   - Return 202 Accepted with message "Order is being processed"
3. Order statuses: `PENDING`, `CONFIRMED`, `FAILED`, `PENDING_INVENTORY`, `PENDING_PAYMENT`
4. Expose Prometheus metrics at `/metrics`

**Order Flow:**
```
1. Receive order request
2. Validate input
3. Create order in DB with status=PENDING
4. Call POST inventory-service:5002/inventory/reserve (2s timeout)
   - If timeout/error: update status=PENDING_INVENTORY, return 202
5. Call POST payment-service:5003/payments (2s timeout)
   - If timeout/error: call inventory/release to rollback, update status=PENDING_PAYMENT, return 202
6. Update status=CONFIRMED, return 201
```

---

### SERVICE 2: Inventory Service (Port 5002)

**Endpoints:**
- `GET /health` - Returns health + DB ping result
- `GET /inventory/:productId` - Returns current stock
- `POST /inventory/reserve` - Reserves stock for order
- `POST /inventory/release` - Releases reserved stock
- `POST /gremlin/latency` - Injects artificial latency for testing

**Gremlin Latency Feature:**
```go
// Store in memory, affects all subsequent requests
var gremlinLatency = struct {
    enabled bool
    delayMs int
}{}

// POST /gremlin/latency
// Body: {"enabled": true, "delay_ms": 3000}
// This makes ALL inventory endpoints sleep for delay_ms before responding
```

**Reserve/Release Logic:**
```sql
-- Reserve: Decrease available, increase reserved
UPDATE inventory SET stock = stock - $quantity, reserved = reserved + $quantity 
WHERE product_id = $id AND stock >= $quantity

-- Release: Increase available, decrease reserved
UPDATE inventory SET stock = stock + $quantity, reserved = reserved - $quantity 
WHERE product_id = $id
```

---

### SERVICE 3: Payment Service (Port 5003)

**Endpoints:**
- `GET /health` - Returns health status
- `POST /payments` - Processes payment for order
- `GET /payments/:id` - Returns payment status

**Payment Logic:**
- Simple mock: 90% success, 10% random failure (simulates real payment gateway)
- Payment statuses: `PENDING`, `SUCCESS`, `FAILED`

---

### DATABASE SCHEMA (PostgreSQL)

Create a single `init.sql` file:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory (
    product_id VARCHAR(255) PRIMARY KEY,
    stock INT DEFAULT 100,
    reserved INT DEFAULT 0
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID,
    amount DECIMAL(10,2) DEFAULT 99.99,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed inventory
INSERT INTO inventory (product_id, stock) VALUES 
    ('PROD-001', 100),
    ('PROD-002', 50),
    ('PROD-003', 25);
```

---

### HEALTH CHECK FORMAT

All services must return this format:

```json
{
  "status": "healthy",
  "service": "order-service",
  "timestamp": "2024-01-29T12:00:00Z",
  "dependencies": {
    "database": "connected",
    "inventory-service": "reachable",
    "payment-service": "reachable"
  }
}
```

If any dependency fails, return status: "degraded" with HTTP 200 (service is up but degraded).

---

### PROMETHEUS METRICS

Each service must expose at `/metrics`:
- `http_requests_total{service, method, path, status_code}` - Counter
- `http_request_duration_seconds{service, method, path}` - Histogram

Use existing middleware pattern from auth service.

---

### DOCKER COMPOSE ADDITIONS

Add these services to the existing docker-compose.yml:

```yaml
  order-service:
    build: ./services/orders
    container_name: order-service
    environment:
      - PORT=5001
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/valerix?sslmode=disable
      - INVENTORY_SERVICE_URL=http://inventory-service:5002
      - PAYMENT_SERVICE_URL=http://payment-service:5003
      - OTEL_EXPORTER_OTLP_ENDPOINT=otel-collector:4317
    ports:
      - "5001:5001"
    depends_on:
      - postgres
      - inventory-service
      - payment-service
    networks:
      - deadlock-network

  inventory-service:
    build: ./services/inventory
    container_name: inventory-service
    environment:
      - PORT=5002
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/valerix?sslmode=disable
      - OTEL_EXPORTER_OTLP_ENDPOINT=otel-collector:4317
    ports:
      - "5002:5002"
    depends_on:
      - postgres
    networks:
      - deadlock-network

  payment-service:
    build: ./services/payments
    container_name: payment-service
    environment:
      - PORT=5003
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/valerix?sslmode=disable
      - OTEL_EXPORTER_OTLP_ENDPOINT=otel-collector:4317
    ports:
      - "5003:5003"
    depends_on:
      - postgres
    networks:
      - deadlock-network

  postgres:
    image: postgres:15
    container_name: postgres
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=valerix
    ports:
      - "5432:5432"
    volumes:
      - ./infra/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - deadlock-network
```

---

### GRAFANA DASHBOARD

Create a simple dashboard JSON with:
1. **SLA Traffic Light Panel**: Shows green if avg latency < 1s, red if > 1s (30s window)
2. **Request Rate Graph**: Requests per second by service
3. **Error Rate Graph**: 5xx errors by service
4. **Latency Percentiles**: P50, P90, P99 by service

---

### MINIMAL FRONTEND

Create a simple HTML page (`frontend/index.html`) with:
1. Service health indicators (green/red dots)
2. Form to create order (product dropdown, quantity)
3. List of recent orders with status
4. SLA indicator that polls every 5 seconds
5. Button to enable/disable Gremlin latency

---

### TESTING CHECKLIST

After building, verify:
1. `curl localhost:5001/health` returns healthy with all deps
2. `curl localhost:5002/health` returns healthy
3. `curl localhost:5003/health` returns healthy
4. Create order works: `curl -X POST localhost:5001/orders -d '{"product_id":"PROD-001","quantity":1}'`
5. Enable gremlin: `curl -X POST localhost:5002/gremlin/latency -d '{"enabled":true,"delay_ms":3000}'`
6. Create order returns 202 with graceful message (timeout triggered)
7. Grafana shows red SLA indicator
8. Disable gremlin, verify orders work again

---

## FILE STRUCTURE TO CREATE

```
services/
├── orders/
│   ├── Dockerfile
│   ├── go.mod
│   ├── main.go
│   ├── server.go
│   ├── config/config.go
│   ├── db/db.go
│   ├── handlers/
│   │   ├── orders.go
│   │   ├── health.go
│   │   └── handler.go
│   ├── client/
│   │   ├── inventory.go
│   │   └── payment.go
│   ├── middleware/prometheus.go
│   └── tracing/tracing.go
├── inventory/
│   ├── Dockerfile
│   ├── go.mod
│   ├── main.go
│   ├── server.go
│   ├── handlers/
│   │   ├── inventory.go
│   │   ├── health.go
│   │   ├── gremlin.go
│   │   └── handler.go
│   └── ... (similar structure)
├── payments/
│   └── ... (similar structure)
frontend/
└── index.html
infra/
└── init.sql
```

---

## PRIORITY ORDER (2-Hour Constraint)

1. **Hour 1**: Get all 3 services running with health endpoints + basic CRUD
2. **Hour 1.5**: Add timeout/graceful degradation to Order Service
3. **Hour 1.75**: Add Gremlin latency injection
4. **Hour 2**: Grafana dashboard + minimal frontend

Skip if running out of time:
- Detailed tracing spans
- Frontend styling
- Complex reconciliation logic

## GO DEPENDENCIES

```go
require (
    github.com/go-chi/chi/v5
    github.com/jackc/pgx/v5
    github.com/prometheus/client_golang
)
```

---

**START BUILDING NOW. Create the services one by one, testing each before moving to the next.**
