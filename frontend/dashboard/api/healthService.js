// Health Check Service API

/**
 * Health Service - Monitors service health and metrics
 * Supports both mock data and real API calls
 */

// API Configuration
// Configuration is loaded from config.js (window.DASHBOARD_CONFIG)
// Fallback to defaults if not available
const MONITORING_CONFIG = {
    ORDER_SERVICE_URL: window.DASHBOARD_CONFIG?.ENDPOINTS?.ORDERS || window.location.origin + '/api/orders',
    INVENTORY_SERVICE_URL: window.DASHBOARD_CONFIG?.ENDPOINTS?.INVENTORY || window.location.origin + '/api/inventory',
    AUTH_SERVICE_URL: window.DASHBOARD_CONFIG?.ENDPOINTS?.AUTH || window.location.origin + '/api/auth',
    API_GATEWAY_URL: window.DASHBOARD_CONFIG?.ENDPOINTS?.GATEWAY || window.location.origin + '/api/gateway',
    DATABASE_URL: window.DASHBOARD_CONFIG?.DATABASE_URL || 'postgresql://postgres:postgres123@47.128.225.20:5432/postgres',
    USE_MOCK_DATA: window.DASHBOARD_CONFIG?.USE_MOCK_DATA ?? true,
    HEALTH_CHECK_TIMEOUT: window.DASHBOARD_CONFIG?.HEALTH_CHECK_TIMEOUT || 3000,
};

class HealthService {
    /**
     * Check health of a specific service
     * @param {string} serviceURL - Service base URL
     * @param {string} serviceName - Service name for logging
     * @returns {Promise<Object>} Health status
     */
    async checkServiceHealth(serviceURL, serviceName) {
        if (MONITORING_CONFIG.USE_MOCK_DATA) {
            return this._mockCheckHealth(serviceName);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), MONITORING_CONFIG.HEALTH_CHECK_TIMEOUT);

        try {
            const startTime = Date.now();
            const response = await fetch(`${serviceURL}/health`, {
                signal: controller.signal,
            });
            const responseTime = Date.now() - startTime;

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                return {
                    name: serviceName,
                    status: 'healthy',
                    responseTime,
                    uptime: data.uptime || 99.9,
                    lastCheck: new Date().toISOString(),
                    endpoint: serviceURL,
                    dependencies: data.dependencies || [],
                };
            } else {
                return {
                    name: serviceName,
                    status: 'degraded',
                    responseTime,
                    uptime: 0,
                    lastCheck: new Date().toISOString(),
                    endpoint: serviceURL,
                    error: `HTTP ${response.status}`,
                };
            }
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                return {
                    name: serviceName,
                    status: 'down',
                    responseTime: MONITORING_CONFIG.HEALTH_CHECK_TIMEOUT,
                    uptime: 0,
                    lastCheck: new Date().toISOString(),
                    endpoint: serviceURL,
                    error: 'Timeout',
                };
            }

            return {
                name: serviceName,
                status: 'down',
                responseTime: 0,
                uptime: 0,
                lastCheck: new Date().toISOString(),
                endpoint: serviceURL,
                error: error.message,
            };
        }
    }

    /**
     * Check health of all services
     * @returns {Promise<Object>} Health status of all services
     */
    async checkAllServices() {
        const [orderService, inventoryService, database] = await Promise.all([
            this.checkServiceHealth(MONITORING_CONFIG.ORDER_SERVICE_URL, 'Order Service'),
            this.checkServiceHealth(MONITORING_CONFIG.INVENTORY_SERVICE_URL, 'Inventory Service'),
            this.checkDatabaseHealth(),
        ]);

        return {
            orderService,
            inventoryService,
            database,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Check database health
     * @returns {Promise<Object>} Database health status
     */
    async checkDatabaseHealth() {
        if (MONITORING_CONFIG.USE_MOCK_DATA) {
            return this._mockCheckHealth('Database');
        }

        // In production, this would connect to a database monitoring endpoint
        // For now, return mock data
        return this._mockCheckHealth('Database');
    }

    /**
     * Get service metrics (response times, error rates, etc.)
     * @param {string} serviceName - Service name
     * @param {number} durationMinutes - Duration to fetch metrics for
     * @returns {Promise<Object>} Service metrics
     */
    async getServiceMetrics(serviceName, durationMinutes = 30) {
        if (MONITORING_CONFIG.USE_MOCK_DATA) {
            return this._mockGetMetrics(serviceName, durationMinutes);
        }

        // Real implementation would call metrics endpoint
        const serviceURL = serviceName === 'order'
            ? MONITORING_CONFIG.ORDER_SERVICE_URL
            : MONITORING_CONFIG.INVENTORY_SERVICE_URL;

        try {
            const response = await fetch(
                `${serviceURL}/metrics?duration=${durationMinutes}`,
                { timeout: 5000 }
            );

            if (response.ok) {
                return await response.json();
            }

            return this._mockGetMetrics(serviceName, durationMinutes);
        } catch (error) {
            return this._mockGetMetrics(serviceName, durationMinutes);
        }
    }

    // ==================== MOCK IMPLEMENTATIONS ====================

    /**
     * Mock: Check service health
     */
    async _mockCheckHealth(serviceName) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));

        // Simulate occasional degradation
        const rand = Math.random();
        let status = 'healthy';
        let responseTime = Math.floor(Math.random() * 200) + 50;

        if (serviceName === 'Inventory Service') {
            // Inventory service has gremlin latency
            if (rand < 0.15) {
                status = 'degraded';
                responseTime = Math.floor(Math.random() * 2000) + 1000;
            }
        } else if (rand < 0.05) {
            status = 'degraded';
            responseTime = Math.floor(Math.random() * 1000) + 500;
        }

        const uptimeMap = {
            'Order Service': 99.8,
            'Inventory Service': 95.2,
            'Database': 99.99,
        };

        return {
            name: serviceName,
            status,
            responseTime,
            uptime: uptimeMap[serviceName] || 99.0,
            lastCheck: new Date().toISOString(),
            endpoint: this._getEndpoint(serviceName),
            dependencies: this._getDependencies(serviceName),
        };
    }

    /**
     * Mock: Get service metrics
     */
    async _mockGetMetrics(serviceName, durationMinutes) {
        await new Promise(resolve => setTimeout(resolve, 300));

        const dataPoints = [];
        const now = Date.now();

        for (let i = 0; i < durationMinutes; i++) {
            const timestamp = now - (durationMinutes - i) * 60 * 1000;
            const baseResponseTime = serviceName === 'order' ? 150 : 180;
            const spikeChance = serviceName === 'inventory' ? 0.15 : 0.05;

            const hasSpike = Math.random() < spikeChance;
            const responseTime = hasSpike
                ? Math.floor(Math.random() * 2000) + 1500
                : baseResponseTime + Math.floor(Math.random() * 60) - 30;

            dataPoints.push({
                timestamp,
                responseTime,
                errorRate: Math.random() * 0.05, // 0-5%
                requestCount: Math.floor(Math.random() * 100) + 50,
            });
        }

        return {
            serviceName,
            durationMinutes,
            dataPoints,
            summary: {
                avgResponseTime: dataPoints.reduce((sum, p) => sum + p.responseTime, 0) / dataPoints.length,
                maxResponseTime: Math.max(...dataPoints.map(p => p.responseTime)),
                minResponseTime: Math.min(...dataPoints.map(p => p.responseTime)),
                totalRequests: dataPoints.reduce((sum, p) => sum + p.requestCount, 0),
            },
        };
    }

    /**
     * Get endpoint for service name
     */
    _getEndpoint(serviceName) {
        const endpointMap = {
            'Order Service': 'http://localhost:5003',
            'Inventory Service': 'http://localhost:5002',
            'Auth Service': 'http://localhost:5001',
            'Database': 'postgresql://postgres:postgres123@47.128.225.20:5432/postgres',
        };
        return endpointMap[serviceName] || 'unknown';
    }

    /**
     * Get dependencies for service name
     */
    _getDependencies(serviceName) {
        const depsMap = {
            'Order Service': ['Inventory Service', 'Database'],
            'Inventory Service': ['Database'],
            'Database': [],
        };
        return depsMap[serviceName] || [];
    }
}

// Create and export singleton instance
const healthService = new HealthService();

/**
 * Configure monitoring settings
 */
function configureMonitoring(config) {
    if (config.orderServiceURL) {
        MONITORING_CONFIG.ORDER_SERVICE_URL = config.orderServiceURL;
    }
    if (config.inventoryServiceURL) {
        MONITORING_CONFIG.INVENTORY_SERVICE_URL = config.inventoryServiceURL;
    }
    if (config.useMockData !== undefined) {
        MONITORING_CONFIG.USE_MOCK_DATA = config.useMockData;
    }
    if (config.healthCheckTimeout !== undefined) {
        MONITORING_CONFIG.HEALTH_CHECK_TIMEOUT = config.healthCheckTimeout;
    }
}
