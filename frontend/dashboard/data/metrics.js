// Static Monitoring Metrics Data
const SERVICES_STATUS = {
    orderService: {
        name: 'Order Service',
        status: 'healthy', // 'healthy', 'degraded', 'down'
        responseTime: 145, // milliseconds
        uptime: 99.8,
        lastCheck: new Date().toISOString(),
        endpoint: 'http://localhost:3001/api/orders',
        dependencies: ['Inventory Service', 'Database']
    },
    inventoryService: {
        name: 'Inventory Service',
        status: 'degraded', // 'healthy', 'degraded', 'down'
        responseTime: 1250, // milliseconds (shows gremlin latency)
        uptime: 95.2,
        lastCheck: new Date().toISOString(),
        endpoint: 'http://localhost:3002/api/inventory',
        dependencies: ['Database']
    },
    database: {
        name: 'Database',
        status: 'healthy',
        responseTime: 8,
        uptime: 99.99,
        lastCheck: new Date().toISOString(),
        endpoint: 'postgresql://localhost:5432/valerix',
        dependencies: []
    }
};

// Response time history (last 30 data points)
const RESPONSE_TIME_HISTORY = [
    { timestamp: Date.now() - 29000, orderService: 150, inventoryService: 180 },
    { timestamp: Date.now() - 28000, orderService: 142, inventoryService: 165 },
    { timestamp: Date.now() - 27000, orderService: 155, inventoryService: 175 },
    { timestamp: Date.now() - 26000, orderService: 148, inventoryService: 2100 }, // Spike
    { timestamp: Date.now() - 25000, orderService: 160, inventoryService: 1850 }, // Spike
    { timestamp: Date.now() - 24000, orderService: 145, inventoryService: 190 },
    { timestamp: Date.now() - 23000, orderService: 152, inventoryService: 185 },
    { timestamp: Date.now() - 22000, orderService: 147, inventoryService: 170 },
    { timestamp: Date.now() - 21000, orderService: 153, inventoryService: 3500 }, // Large spike
    { timestamp: Date.now() - 20000, orderService: 149, inventoryService: 2200 }, // Spike
    { timestamp: Date.now() - 19000, orderService: 158, inventoryService: 195 },
    { timestamp: Date.now() - 18000, orderService: 143, inventoryService: 180 },
    { timestamp: Date.now() - 17000, orderService: 156, inventoryService: 175 },
    { timestamp: Date.now() - 16000, orderService: 150, inventoryService: 1650 }, // Spike
    { timestamp: Date.now() - 15000, orderService: 146, inventoryService: 185 },
    { timestamp: Date.now() - 14000, orderService: 154, inventoryService: 190 },
    { timestamp: Date.now() - 13000, orderService: 148, inventoryService: 170 },
    { timestamp: Date.now() - 12000, orderService: 151, inventoryService: 2800 }, // Spike
    { timestamp: Date.now() - 11000, orderService: 147, inventoryService: 180 },
    { timestamp: Date.now() - 10000, orderService: 155, inventoryService: 175 },
    { timestamp: Date.now() - 9000, orderService: 149, inventoryService: 165 },
    { timestamp: Date.now() - 8000, orderService: 152, inventoryService: 1950 }, // Spike
    { timestamp: Date.now() - 7000, orderService: 144, inventoryService: 185 },
    { timestamp: Date.now() - 6000, orderService: 158, inventoryService: 190 },
    { timestamp: Date.now() - 5000, orderService: 146, inventoryService: 3100 }, // Spike
    { timestamp: Date.now() - 4000, orderService: 150, inventoryService: 180 },
    { timestamp: Date.now() - 3000, orderService: 153, inventoryService: 175 },
    { timestamp: Date.now() - 2000, orderService: 145, inventoryService: 1200 }, // Current spike
    { timestamp: Date.now() - 1000, orderService: 148, inventoryService: 1350 }, // Current spike
    { timestamp: Date.now(), orderService: 145, inventoryService: 1250 }, // Current
];

// Recent activity log
const ACTIVITY_LOG = [
    {
        id: 1,
        timestamp: new Date(Date.now() - 120000).toISOString(),
        service: 'Inventory Service',
        type: 'warning',
        message: 'Response time exceeded 1000ms threshold',
        details: 'Average response time: 1850ms over 30s window'
    },
    {
        id: 2,
        timestamp: new Date(Date.now() - 180000).toISOString(),
        service: 'Order Service',
        type: 'info',
        message: 'Health check passed',
        details: 'All dependencies connected successfully'
    },
    {
        id: 3,
        timestamp: new Date(Date.now() - 240000).toISOString(),
        service: 'Inventory Service',
        type: 'error',
        message: 'Request timeout detected',
        details: 'Order ID: ORD-001237 experienced timeout during inventory update'
    },
    {
        id: 4,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        service: 'Database',
        type: 'info',
        message: 'Connection pool optimized',
        details: 'Max connections: 100, Active: 23'
    },
    {
        id: 5,
        timestamp: new Date(Date.now() - 360000).toISOString(),
        service: 'Inventory Service',
        type: 'warning',
        message: 'Gremlin latency pattern detected',
        details: 'Deterministic delays every 3rd request'
    },
    {
        id: 6,
        timestamp: new Date(Date.now() - 420000).toISOString(),
        service: 'Order Service',
        type: 'success',
        message: 'Circuit breaker activated',
        details: 'Prevented cascade failure, fallback response returned'
    },
    {
        id: 7,
        timestamp: new Date(Date.now() - 480000).toISOString(),
        service: 'Inventory Service',
        type: 'error',
        message: 'Database connection timeout',
        details: 'Reconnection successful after 2.3s'
    },
    {
        id: 8,
        timestamp: new Date(Date.now() - 540000).toISOString(),
        service: 'Order Service',
        type: 'info',
        message: 'Load balancer health check passed',
        details: 'Response time: 142ms'
    }
];

// Failure statistics
const FAILURE_STATS = {
    last24Hours: {
        totalRequests: 15420,
        successfulRequests: 14892,
        failedRequests: 328,
        timeoutRequests: 200,
        errorRequests: 128,
        successRate: 96.6
    },
    last7Days: {
        totalRequests: 98450,
        successfulRequests: 95123,
        failedRequests: 3327,
        timeoutRequests: 2100,
        errorRequests: 1227,
        successRate: 96.6
    }
};

// Calculate rolling 30-second average
function calculateRollingAverage(data, windowSeconds = 30) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const recentData = data.filter(point => (now - point.timestamp) <= windowMs);

    if (recentData.length === 0) return { orderService: 0, inventoryService: 0 };

    const orderSum = recentData.reduce((sum, point) => sum + point.orderService, 0);
    const inventorySum = recentData.reduce((sum, point) => sum + point.inventoryService, 0);

    return {
        orderService: Math.round(orderSum / recentData.length),
        inventoryService: Math.round(inventorySum / recentData.length)
    };
}

// Format time ago
function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return time.toLocaleDateString();
}
