// Real-time Data Simulation Utilities

// Generate realistic response time with occasional spikes
function generateResponseTime(baseTime, spikeChance = 0.15) {
    const hasSpike = Math.random() < spikeChance;
    if (hasSpike) {
        // Generate spike between 1500-3500ms
        return Math.floor(Math.random() * 2000) + 1500;
    }
    // Normal variation ±30ms
    const variation = Math.floor(Math.random() * 60) - 30;
    return Math.max(baseTime + variation, 50);
}

// Simulate service status changes
function simulateServiceStatus(currentStatus, uptime) {
    // Higher uptime = less likely to degrade
    const degradeChance = (100 - uptime) / 500; // 99.8% uptime = 0.4% chance
    const recoverChance = 0.3; // 30% chance to recover if degraded

    if (currentStatus === 'healthy') {
        if (Math.random() < degradeChance) {
            return 'degraded';
        }
    } else if (currentStatus === 'degraded') {
        if (Math.random() < recoverChance) {
            return 'healthy';
        } else if (Math.random() < 0.05) {
            return 'down';
        }
    } else if (currentStatus === 'down') {
        if (Math.random() < 0.4) {
            return 'degraded';
        }
    }

    return currentStatus;
}

// Generate activity log entry
function generateActivityLogEntry(serviceStatus) {
    const templates = {
        orderService: {
            success: [
                { message: 'Order processed successfully', details: `Order ID: ORD-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}` },
                { message: 'Circuit breaker activated', details: 'Prevented cascade failure, fallback response returned' },
                { message: 'Health check passed', details: 'All dependencies connected successfully' },
            ],
            info: [
                { message: 'Load balancer health check passed', details: `Response time: ${Math.floor(Math.random() * 100) + 100}ms` },
                { message: 'Cache hit rate optimized', details: `Current hit rate: ${Math.floor(Math.random() * 20) + 75}%` },
            ],
            warning: [
                { message: 'Response time increased', details: `Average response time: ${Math.floor(Math.random() * 500) + 500}ms` },
                { message: 'Retry attempt triggered', details: 'Request succeeded after 1 retry' },
            ],
            error: [
                { message: 'Request timeout detected', details: `Order ID: ORD-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')} experienced timeout` },
            ]
        },
        inventoryService: {
            success: [
                { message: 'Inventory sync completed', details: `${Math.floor(Math.random() * 50) + 10} items updated` },
                { message: 'Stock level validated', details: 'All products within acceptable range' },
            ],
            info: [
                { message: 'Health check passed', details: 'Database connection stable' },
                { message: 'Cache refreshed', details: 'Inventory data updated from database' },
            ],
            warning: [
                { message: 'Response time exceeded 1000ms threshold', details: `Average response time: ${Math.floor(Math.random() * 1000) + 1000}ms over 30s window` },
                { message: 'Gremlin latency pattern detected', details: 'Deterministic delays every 3rd request' },
            ],
            error: [
                { message: 'Database connection timeout', details: `Reconnection successful after ${(Math.random() * 3 + 1).toFixed(1)}s` },
                { message: 'Stock update failed', details: `Product ID: PRD-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}` },
            ]
        },
        database: {
            success: [
                { message: 'Query optimization applied', details: `Query time reduced by ${Math.floor(Math.random() * 30) + 10}%` },
            ],
            info: [
                { message: 'Connection pool optimized', details: `Max connections: 100, Active: ${Math.floor(Math.random() * 40) + 15}` },
                { message: 'Backup completed', details: `Size: ${(Math.random() * 500 + 200).toFixed(1)}MB` },
            ],
            warning: [
                { message: 'Connection pool near capacity', details: `Active connections: ${Math.floor(Math.random() * 15) + 85}/100` },
            ],
        }
    };

    const services = ['orderService', 'inventoryService', 'database'];
    const service = services[Math.floor(Math.random() * services.length)];

    // Determine type based on service status
    let type = 'info';
    if (serviceStatus[service]?.status === 'degraded') {
        type = Math.random() < 0.6 ? 'warning' : 'info';
    } else if (serviceStatus[service]?.status === 'down') {
        type = Math.random() < 0.7 ? 'error' : 'warning';
    } else {
        const rand = Math.random();
        if (rand < 0.5) type = 'success';
        else if (rand < 0.8) type = 'info';
        else if (rand < 0.95) type = 'warning';
        else type = 'error';
    }

    const serviceTemplates = templates[service];
    const typeTemplates = serviceTemplates[type] || serviceTemplates.info;
    const template = typeTemplates[Math.floor(Math.random() * typeTemplates.length)];

    const serviceNames = {
        orderService: 'Order Service',
        inventoryService: 'Inventory Service',
        database: 'Database'
    };

    return {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        service: serviceNames[service],
        type: type,
        message: template.message,
        details: template.details
    };
}

// Update failure statistics incrementally
function updateFailureStats(currentStats) {
    const newRequests = Math.floor(Math.random() * 20) + 5;
    const failureRate = Math.random() * 0.05; // 0-5% failure rate
    const timeoutRate = Math.random() * 0.03; // 0-3% timeout rate

    const newFailed = Math.floor(newRequests * failureRate);
    const newTimeout = Math.floor(newRequests * timeoutRate);
    const newErrors = Math.max(0, newFailed - newTimeout);
    const newSuccess = newRequests - newFailed;

    const totalRequests = currentStats.totalRequests + newRequests;
    const successfulRequests = currentStats.successfulRequests + newSuccess;
    const failedRequests = currentStats.failedRequests + newFailed;
    const timeoutRequests = currentStats.timeoutRequests + newTimeout;
    const errorRequests = currentStats.errorRequests + newErrors;

    return {
        totalRequests,
        successfulRequests,
        failedRequests,
        timeoutRequests,
        errorRequests,
        successRate: parseFloat(((successfulRequests / totalRequests) * 100).toFixed(1))
    };
}
