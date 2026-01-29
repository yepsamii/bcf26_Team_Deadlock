// API Module - Central export for all API services

/**
 * API Module
 *
 * This module provides a unified interface to all backend services.
 * It automatically handles mock data vs real API calls based on FEATURE_FLAGS.
 *
 * Usage:
 *   import { orderService, inventoryService } from './api';
 *
 *   const response = await orderService.createOrder(orderData);
 *   if (response.success) {
 *     console.log('Order created:', response.data);
 *   } else {
 *     console.error('Error:', response.error.message);
 *   }
 */

// Export all services
const API = {
    orders: orderService,
    inventory: inventoryService,
};

/**
 * Helper function to handle API responses uniformly
 * @param {Promise<APIResponse>} apiCall - API call promise
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
async function handleAPICall(apiCall, onSuccess, onError) {
    try {
        const response = await apiCall;

        if (response.success) {
            if (onSuccess) onSuccess(response.data);
            return response;
        } else {
            if (onError) onError(response.error);
            return response;
        }
    } catch (error) {
        const errorResponse = {
            success: false,
            error: {
                status: 0,
                message: error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
                type: 'exception',
            },
        };

        if (onError) onError(errorResponse.error);
        return errorResponse;
    }
}

/**
 * Toggle between mock data and real API
 * @param {boolean} useMock - Whether to use mock data
 */
function setUseMockData(useMock) {
    FEATURE_FLAGS.USE_MOCK_DATA = useMock;
}

/**
 * Configure API settings
 * @param {Object} config - Configuration object
 */
function configureAPI(config) {
    if (config.orderServiceURL) {
        API_CONFIG.ORDER_SERVICE_URL = config.orderServiceURL;
    }
    if (config.inventoryServiceURL) {
        API_CONFIG.INVENTORY_SERVICE_URL = config.inventoryServiceURL;
    }
    if (config.useMockData !== undefined) {
        FEATURE_FLAGS.USE_MOCK_DATA = config.useMockData;
    }
    if (config.simulateDelay !== undefined) {
        FEATURE_FLAGS.SIMULATE_NETWORK_DELAY = config.simulateDelay;
    }
    if (config.delayMs !== undefined) {
        FEATURE_FLAGS.NETWORK_DELAY_MS = config.delayMs;
    }
}

/**
 * Get current API configuration
 */
function getAPIConfig() {
    return {
        orderServiceURL: API_CONFIG.ORDER_SERVICE_URL,
        inventoryServiceURL: API_CONFIG.INVENTORY_SERVICE_URL,
        useMockData: FEATURE_FLAGS.USE_MOCK_DATA,
        simulateDelay: FEATURE_FLAGS.SIMULATE_NETWORK_DELAY,
        delayMs: FEATURE_FLAGS.NETWORK_DELAY_MS,
    };
}
