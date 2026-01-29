# Monitoring Dashboard

Real-time monitoring dashboard for The Warehouse that Blinks microservices.

## Features

- **Service Health Monitoring**: Real-time health status for all services
- **Performance Metrics**: Response time tracking with 30-second rolling averages
- **Visual Alerts**: Automatic color-coded alerts when response times exceed thresholds
- **Activity Logs**: Real-time event logging
- **Failure Statistics**: Request success/failure tracking

## Quick Start with Docker Compose

### 1. Build and Run

```bash
# Build and start all services including the dashboard
docker-compose up -d --build

# Or rebuild only the dashboard
docker-compose up -d --build monitoring-dashboard
```

### 2. Access the Dashboard

Open your browser and navigate to:
```
http://localhost:3001
```

### 3. View Logs

```bash
# View dashboard logs
docker-compose logs -f monitoring-dashboard

# View all services
docker-compose logs -f
```

## Configuration

The dashboard behavior is controlled by `config.js`:

### Switch Between Mock and Real Data

Edit `frontend/dashboard/config.js`:

```javascript
window.DASHBOARD_CONFIG = {
    // Set to false to connect to real services
    USE_MOCK_DATA: false,

    // ... other settings
};
```

**Mock Data Mode** (default):
- Uses simulated data with realistic patterns
- Good for testing and demonstration
- No backend services required

**Real Data Mode**:
- Connects to actual microservices
- Shows real health status and metrics
- Requires all services to be running

### Customize Alert Thresholds

```javascript
window.DASHBOARD_CONFIG = {
    // Response time alert threshold (in milliseconds)
    ALERT_THRESHOLD_MS: 1000, // Changes from green to red

    // Rolling window for average calculation
    ROLLING_WINDOW_SECONDS: 30,

    // How often to update response time data
    RESPONSE_TIME_UPDATE_INTERVAL: 2000, // 2 seconds
};
```

## Architecture

### Docker Network Integration

The dashboard runs in an nginx container that proxies requests to services:

```
Browser → nginx (port 3001) → /api/auth → auth-service:5001
                              → /api/inventory → inventory-service:5002
                              → /api/orders → orders-service:5003
                              → /api/gateway → api-gateway:5000
```

### Health Check Endpoints

The dashboard monitors these endpoints:

| Service | Health Endpoint | Database Check |
|---------|----------------|----------------|
| Auth Service | `http://auth-service:5001/health` | ✅ Yes |
| Inventory Service | `http://inventory-service:5002/health` | ✅ Yes |
| Orders Service | `http://orders-service:5003/health` | ✅ Yes |
| API Gateway | `http://api-gateway:5000/health` | ✅ Downstream |

### Visual Alert System

**Order Service Response Time Monitor:**
- **Green**: Average response time ≤ 1000ms over 30-second window
- **Red**: Average response time > 1000ms over 30-second window
- Shows "ALERT" badge and detailed warning message

## Local Development (Outside Docker)

### 1. Update Configuration

Edit `config.js` and uncomment the local development section:

```javascript
if (window.location.hostname === 'localhost' && window.location.port !== '3001') {
    window.DASHBOARD_CONFIG.ENDPOINTS = {
        AUTH: 'http://localhost:5001',
        INVENTORY: 'http://localhost:5002',
        ORDERS: 'http://localhost:5003',
        GATEWAY: 'http://localhost:5000'
    };
}
```

### 2. Serve Locally

```bash
cd frontend/dashboard

# Using Python
python3 -m http.server 8080

# Using Node.js
npx http-server -p 8080

# Using PHP
php -S localhost:8080
```

### 3. Access Dashboard

Open `http://localhost:8080` in your browser.

## Testing Health Endpoints

### Test Individual Services

```bash
# Auth Service
curl http://localhost:5001/health | jq

# Inventory Service
curl http://localhost:5002/health | jq

# Orders Service
curl http://localhost:5003/health | jq

# API Gateway
curl http://localhost:5000/health | jq
```

### Test via Dashboard Proxy

When dashboard is running in Docker:

```bash
# Through nginx proxy
curl http://localhost:3001/api/auth/health | jq
curl http://localhost:3001/api/inventory/health | jq
curl http://localhost:3001/api/orders/health | jq
curl http://localhost:3001/api/gateway/health | jq
```

## Troubleshooting

### Dashboard Not Loading

```bash
# Check if container is running
docker-compose ps monitoring-dashboard

# Check logs
docker-compose logs monitoring-dashboard

# Restart dashboard
docker-compose restart monitoring-dashboard
```

### Services Showing as Unhealthy

1. Check if services are running:
```bash
docker-compose ps
```

2. Verify network connectivity:
```bash
docker-compose exec monitoring-dashboard ping auth-service
docker-compose exec monitoring-dashboard ping inventory-service
```

3. Check service logs:
```bash
docker-compose logs auth-service
docker-compose logs inventory-service
docker-compose logs orders-service
```

### CORS Errors

If you see CORS errors in the browser console:

1. Verify services have CORS enabled
2. Check nginx configuration in `nginx.conf`
3. Ensure the dashboard is accessing services through the proxy (`/api/*`)

### Database Connection Issues

Services showing "Database disconnected":

1. Verify database is accessible:
```bash
psql postgresql://postgres:postgres123@47.128.225.20:5432/postgres
```

2. Check network connectivity from containers:
```bash
docker-compose exec auth-service ping 47.128.225.20
```

## Production Deployment

### Environment Variables

For production, you can set environment variables in docker-compose.yml:

```yaml
monitoring-dashboard:
  environment:
    - USE_MOCK_DATA=false
    - ALERT_THRESHOLD=1000
```

### Kubernetes Deployment

For Kubernetes, create a ConfigMap with the dashboard configuration:

```bash
kubectl create configmap dashboard-config \
  --from-file=config.js=./frontend/dashboard/config.js
```

## Monitoring Stack Integration

The dashboard integrates with the existing monitoring stack:

- **Prometheus**: Scrapes metrics from `/metrics` endpoints
- **Grafana**: Visualization dashboards (port 3030)
- **Loki**: Log aggregation
- **Jaeger**: Distributed tracing (port 16686)

Access full monitoring stack:
- Dashboard: http://localhost:3001
- Grafana: http://localhost:3030 (admin/admin)
- Prometheus: http://localhost:9090
- Jaeger: http://localhost:16686

## File Structure

```
frontend/dashboard/
├── Dockerfile              # Docker build configuration
├── nginx.conf             # Nginx proxy configuration
├── config.js              # Dashboard configuration
├── index.html             # Main HTML file
├── README.md              # This file
├── api/
│   └── healthService.js   # API client for health checks
├── components/
│   ├── ServiceHealthCard.js      # Service status display
│   ├── ResponseTimeIndicator.js  # Performance monitoring
│   ├── ActivityLog.js            # Event logging
│   └── FailureStats.js           # Statistics display
├── data/
│   └── metrics.js         # Mock data and utilities
└── utils/
    └── simulation.js      # Data simulation utilities
```

## Contributing

When modifying the dashboard:

1. Test locally first
2. Rebuild the Docker image: `docker-compose up -d --build monitoring-dashboard`
3. Verify all services show correct status
4. Test alert system by simulating high response times

## License

Part of The Warehouse that Blinks - Team Deadlock
