// API Configuration

// API Base URLs - Update these when backend is deployed
const API_CONFIG = {
    ORDER_SERVICE_URL: 'http://localhost:3001',
    INVENTORY_SERVICE_URL: 'http://localhost:3002',
    // Add more service URLs as needed
};

// Feature flags
const FEATURE_FLAGS = {
    USE_MOCK_DATA: true, // Set to false when backend is ready
    SIMULATE_NETWORK_DELAY: true, // Simulate network latency for testing
    NETWORK_DELAY_MS: 500, // Simulated network delay
};

// API Endpoints
const ENDPOINTS = {
    // Order Service
    ORDERS: {
        LIST: '/api/orders',
        CREATE: '/api/orders',
        GET_BY_ID: (id) => `/api/orders/${id}`,
        UPDATE_STATUS: (id) => `/api/orders/${id}/status`,
        CANCEL: (id) => `/api/orders/${id}/cancel`,
    },

    // Inventory Service
    INVENTORY: {
        LIST: '/api/inventory',
        GET_BY_ID: (id) => `/api/inventory/${id}`,
        CHECK_STOCK: (id) => `/api/inventory/${id}/stock`,
        RESERVE_STOCK: '/api/inventory/reserve',
        RELEASE_STOCK: '/api/inventory/release',
    },

    // Health Checks
    HEALTH: {
        ORDER_SERVICE: '/health',
        INVENTORY_SERVICE: '/health',
    },
};

// HTTP Status Codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TIMEOUT: 408,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};

// Error Messages
const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    TIMEOUT: 'Request timed out. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    NOT_FOUND: 'Resource not found.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    VALIDATION_ERROR: 'Invalid data provided.',
    UNKNOWN_ERROR: 'An unexpected error occurred.',
};
