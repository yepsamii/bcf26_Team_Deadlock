// Order Service API

/**
 * Order Service - Handles all order-related API calls
 * Supports both mock data and real API calls based on FEATURE_FLAGS.USE_MOCK_DATA
 */

class OrderService {
    constructor(httpClient) {
        this.client = httpClient;
    }

    /**
     * Get all orders for the current user
     * @returns {Promise<APIResponse>}
     */
    async getOrders() {
        if (FEATURE_FLAGS.USE_MOCK_DATA) {
            return this._mockGetOrders();
        }

        return this.client.get(ENDPOINTS.ORDERS.LIST);
    }

    /**
     * Get a specific order by ID
     * @param {string} orderId - Order ID
     * @returns {Promise<APIResponse>}
     */
    async getOrderById(orderId) {
        if (FEATURE_FLAGS.USE_MOCK_DATA) {
            return this._mockGetOrderById(orderId);
        }

        return this.client.get(ENDPOINTS.ORDERS.GET_BY_ID(orderId));
    }

    /**
     * Create a new order
     * @param {Object} orderData - Order data
     * @param {Array} orderData.items - Array of items {productId, quantity}
     * @param {Object} orderData.shippingAddress - Shipping address
     * @returns {Promise<APIResponse>}
     */
    async createOrder(orderData) {
        if (FEATURE_FLAGS.USE_MOCK_DATA) {
            return this._mockCreateOrder(orderData);
        }

        // Validate order data
        const validationError = this._validateOrderData(orderData);
        if (validationError) {
            return {
                success: false,
                error: {
                    status: HTTP_STATUS.BAD_REQUEST,
                    message: validationError,
                    type: 'validation',
                },
            };
        }

        return this.client.post(ENDPOINTS.ORDERS.CREATE, orderData);
    }

    /**
     * Update order status
     * @param {string} orderId - Order ID
     * @param {string} status - New status
     * @returns {Promise<APIResponse>}
     */
    async updateOrderStatus(orderId, status) {
        if (FEATURE_FLAGS.USE_MOCK_DATA) {
            return this._mockUpdateOrderStatus(orderId, status);
        }

        return this.client.patch(ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), { status });
    }

    /**
     * Cancel an order
     * @param {string} orderId - Order ID
     * @returns {Promise<APIResponse>}
     */
    async cancelOrder(orderId) {
        if (FEATURE_FLAGS.USE_MOCK_DATA) {
            return this._mockCancelOrder(orderId);
        }

        return this.client.post(ENDPOINTS.ORDERS.CANCEL(orderId));
    }

    /**
     * Validate order data before submission
     */
    _validateOrderData(orderData) {
        if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
            return 'Order must contain at least one item';
        }

        for (const item of orderData.items) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                return 'All items must have a valid productId and quantity';
            }
        }

        if (!orderData.shippingAddress || !orderData.shippingAddress.name) {
            return 'Valid shipping address is required';
        }

        return null;
    }

    // ==================== MOCK IMPLEMENTATIONS ====================

    /**
     * Mock: Get all orders
     */
    async _mockGetOrders() {
        await this._simulateDelay();

        return {
            success: true,
            data: ORDERS_HISTORY,
            status: HTTP_STATUS.OK,
        };
    }

    /**
     * Mock: Get order by ID
     */
    async _mockGetOrderById(orderId) {
        await this._simulateDelay();

        const order = ORDERS_HISTORY.find(o => o.id === orderId);

        if (!order) {
            return {
                success: false,
                error: {
                    status: HTTP_STATUS.NOT_FOUND,
                    message: ERROR_MESSAGES.NOT_FOUND,
                },
                status: HTTP_STATUS.NOT_FOUND,
            };
        }

        return {
            success: true,
            data: order,
            status: HTTP_STATUS.OK,
        };
    }

    /**
     * Mock: Create order
     */
    async _mockCreateOrder(orderData) {
        await this._simulateDelay();

        // Simulate random failures (10% chance)
        if (Math.random() < 0.1) {
            const errorTypes = [
                {
                    status: HTTP_STATUS.TIMEOUT,
                    message: 'Inventory service timeout',
                    type: 'timeout',
                },
                {
                    status: HTTP_STATUS.SERVICE_UNAVAILABLE,
                    message: 'Service temporarily unavailable',
                    type: 'service_unavailable',
                },
                {
                    status: HTTP_STATUS.CONFLICT,
                    message: 'Insufficient stock for requested items',
                    type: 'stock_conflict',
                },
            ];

            const error = errorTypes[Math.floor(Math.random() * errorTypes.length)];
            return {
                success: false,
                error,
                status: error.status,
            };
        }

        // Create new order
        const newOrder = {
            id: `ORD-${Date.now().toString().slice(-6)}`,
            date: new Date().toISOString(),
            status: 'processing',
            items: orderData.items,
            shippingAddress: orderData.shippingAddress,
            trackingNumber: `VLX${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            ...orderData,
        };

        return {
            success: true,
            data: newOrder,
            status: HTTP_STATUS.CREATED,
        };
    }

    /**
     * Mock: Update order status
     */
    async _mockUpdateOrderStatus(orderId, status) {
        await this._simulateDelay();

        return {
            success: true,
            data: { orderId, status, updatedAt: new Date().toISOString() },
            status: HTTP_STATUS.OK,
        };
    }

    /**
     * Mock: Cancel order
     */
    async _mockCancelOrder(orderId) {
        await this._simulateDelay();

        return {
            success: true,
            data: { orderId, status: 'cancelled', cancelledAt: new Date().toISOString() },
            status: HTTP_STATUS.OK,
        };
    }

    /**
     * Simulate network delay
     */
    async _simulateDelay() {
        if (FEATURE_FLAGS.SIMULATE_NETWORK_DELAY) {
            await new Promise(resolve => setTimeout(resolve, FEATURE_FLAGS.NETWORK_DELAY_MS));
        }
    }
}

// Create and export singleton instance
const orderService = new OrderService(orderServiceClient);
