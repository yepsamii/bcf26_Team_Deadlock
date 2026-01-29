// Utility functions for metrics calculation and formatting
// NO STATIC DATA - All data comes from real service endpoints

/**
 * Calculate rolling average from response time data
 * @param {Array} data - Array of {timestamp, orderService, inventoryService} objects
 * @param {number} windowSeconds - Window size in seconds (default 30)
 * @returns {Object} Rolling averages for each service
 */
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

/**
 * Format timestamp as relative time (e.g., "5m ago", "2h ago")
 * @param {string|Date} timestamp - ISO timestamp or Date object
 * @returns {string} Formatted relative time
 */
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

/**
 * Parse health check response to standardized format
 * @param {Object} healthData - Raw health check response
 * @param {string} serviceName - Service name
 * @returns {Object} Standardized service status object
 */
function parseHealthResponse(healthData, serviceName) {
    return {
        name: serviceName,
        status: healthData.status || 'unknown',
        responseTime: healthData.responseTime || 0,
        uptime: healthData.uptime || 0,
        lastCheck: healthData.lastCheck || new Date().toISOString(),
        endpoint: healthData.endpoint || '',
        dependencies: healthData.dependencies || [],
        database: healthData.database || healthData.Database || 'unknown',
        message: healthData.message || healthData.Message || ''
    };
}

/**
 * Determine service status from health check
 * @param {Object} response - Fetch response object
 * @param {Object} data - Response data
 * @returns {string} 'healthy', 'degraded', or 'down'
 */
function determineServiceStatus(response, data) {
    if (!response || !response.ok) {
        return 'down';
    }

    if (data.status === 'unhealthy' || data.database === 'disconnected') {
        return 'degraded';
    }

    return 'healthy';
}

/**
 * Initialize empty response time history
 * @param {number} size - Number of initial data points (default 30)
 * @returns {Array} Array of initial data points
 */
function initializeResponseTimeHistory(size = 30) {
    const history = [];
    const now = Date.now();

    // Start with zeros - real data will populate quickly
    for (let i = size - 1; i >= 0; i--) {
        history.push({
            timestamp: now - (i * 2000), // 2 second intervals
            orderService: 0,
            inventoryService: 0
        });
    }

    return history;
}

/**
 * Initialize empty services status
 * @returns {Object} Initial services status object
 */
function initializeServicesStatus() {
    return {
        orderService: {
            name: 'Order Service',
            status: 'unknown',
            responseTime: 0,
            uptime: 0,
            lastCheck: new Date().toISOString(),
            endpoint: window.DASHBOARD_CONFIG?.ENDPOINTS?.ORDERS || '/api/orders',
            dependencies: [],
            database: 'unknown'
        },
        inventoryService: {
            name: 'Inventory Service',
            status: 'unknown',
            responseTime: 0,
            uptime: 0,
            lastCheck: new Date().toISOString(),
            endpoint: window.DASHBOARD_CONFIG?.ENDPOINTS?.INVENTORY || '/api/inventory',
            dependencies: [],
            database: 'unknown'
        },
        authService: {
            name: 'Auth Service',
            status: 'unknown',
            responseTime: 0,
            uptime: 0,
            lastCheck: new Date().toISOString(),
            endpoint: window.DASHBOARD_CONFIG?.ENDPOINTS?.AUTH || '/api/auth',
            dependencies: [],
            database: 'unknown'
        }
    };
}

/**
 * Initialize empty activity log
 * @returns {Array} Empty activity log array
 */
function initializeActivityLog() {
    return [];
}

/**
 * Initialize failure statistics
 * @returns {Object} Initial failure statistics
 */
function initializeFailureStats() {
    return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        timeoutRequests: 0,
        errorRequests: 0,
        successRate: 0
    };
}

/**
 * Add activity log entry
 * @param {Array} log - Current activity log
 * @param {string} service - Service name
 * @param {string} type - Log type (info, warning, error, success)
 * @param {string} message - Log message
 * @param {string} details - Additional details
 * @returns {Array} Updated activity log
 */
function addActivityLogEntry(log, service, type, message, details = '') {
    const entry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        service,
        type,
        message,
        details
    };

    // Keep only last 20 entries
    return [entry, ...log.slice(0, 19)];
}

/**
 * Update failure statistics with new request data
 * @param {Object} stats - Current statistics
 * @param {boolean} success - Whether request was successful
 * @param {boolean} timeout - Whether request timed out
 * @returns {Object} Updated statistics
 */
function updateFailureStatsWithRequest(stats, success, timeout = false) {
    const newStats = { ...stats };
    newStats.totalRequests++;

    if (success) {
        newStats.successfulRequests++;
    } else {
        newStats.failedRequests++;
        if (timeout) {
            newStats.timeoutRequests++;
        } else {
            newStats.errorRequests++;
        }
    }

    newStats.successRate = newStats.totalRequests > 0
        ? ((newStats.successfulRequests / newStats.totalRequests) * 100).toFixed(1)
        : 0;

    return newStats;
}
