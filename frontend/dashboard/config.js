// Dashboard Configuration
// This file allows you to configure the dashboard behavior

const API_BASE_URL = 'http://13.212.182.34'

window.DASHBOARD_CONFIG = {
    // Set to false to connect to real services
    // Set to true to use mock/simulated data
    USE_MOCK_DATA: false,

    // Service endpoints (used when USE_MOCK_DATA is false)
    // In Docker: nginx will proxy /api/* to the actual services
    // Locally: you can override these to point to localhost:PORT
    ENDPOINTS: {
        AUTH: API_BASE_URL + '/auth',
        INVENTORY: API_BASE_URL + '/inventory',
        ORDERS: API_BASE_URL + '/orders',
        GATEWAY: API_BASE_URL + '/gateway'
    },

    // Health check settings
    HEALTH_CHECK_TIMEOUT: 3000, // 3 seconds
    HEALTH_CHECK_INTERVAL: 10000, // 10 seconds

    // Response time monitoring
    RESPONSE_TIME_UPDATE_INTERVAL: 2000, // 2 seconds
    ROLLING_WINDOW_SECONDS: 30, // 30 seconds
    ALERT_THRESHOLD_MS: 1000, // 1 second (1000ms)

    // Database connection (for display purposes only)
    DATABASE_URL: 'postgresql://postgres@47.128.225.20:5432/postgres'
};

// For local development, you can override endpoints like this:
// Uncomment the lines below if running dashboard locally outside Docker
/*
if (window.location.hostname === 'localhost' && window.location.port !== '3001') {
    window.DASHBOARD_CONFIG.ENDPOINTS = {
        AUTH: 'http://localhost:5001',
        INVENTORY: 'http://localhost:5002',
        ORDERS: 'http://localhost:5003',
        GATEWAY: 'http://localhost:5000'
    };
}
*/
