// Inventory Service API

/**
 * Inventory Service - Handles all inventory-related API calls
 * Supports both mock data and real API calls based on FEATURE_FLAGS.USE_MOCK_DATA
 */

class InventoryService {
    constructor(httpClient) {
        this.client = httpClient;
    }

    /**
     * Get all products in inventory
     * @returns {Promise<APIResponse>}
     */
    async getProducts() {
        if (FEATURE_FLAGS.USE_MOCK_DATA) {
            return this._mockGetProducts();
        }

        return this.client.get(ENDPOINTS.INVENTORY.LIST);
    }

    /**
     * Get a specific product by ID
     * @param {number} productId - Product ID
     * @returns {Promise<APIResponse>}
     */
    async getProductById(productId) {
        if (FEATURE_FLAGS.USE_MOCK_DATA) {
            return this._mockGetProductById(productId);
        }

        return this.client.get(ENDPOINTS.INVENTORY.GET_BY_ID(productId));
    }

    /**
     * Check stock availability for a product
     * @param {number} productId - Product ID
     * @param {number} quantity - Requested quantity
     * @returns {Promise<APIResponse>}
     */
    async checkStock(productId, quantity) {
        if (FEATURE_FLAGS.USE_MOCK_DATA) {
            return this._mockCheckStock(productId, quantity);
        }

        return this.client.get(
            `${ENDPOINTS.INVENTORY.CHECK_STOCK(productId)}?quantity=${quantity}`
        );
    }

    /**
     * Reserve stock for an order (called during order creation)
     * @param {Array} items - Array of {productId, quantity}
     * @returns {Promise<APIResponse>}
     */
    async reserveStock(items) {
        if (FEATURE_FLAGS.USE_MOCK_DATA) {
            return this._mockReserveStock(items);
        }

        return this.client.post(ENDPOINTS.INVENTORY.RESERVE_STOCK, { items });
    }

    /**
     * Release reserved stock (called when order is cancelled)
     * @param {string} reservationId - Reservation ID from reserveStock
     * @returns {Promise<APIResponse>}
     */
    async releaseStock(reservationId) {
        if (FEATURE_FLAGS.USE_MOCK_DATA) {
            return this._mockReleaseStock(reservationId);
        }

        return this.client.post(ENDPOINTS.INVENTORY.RELEASE_STOCK, { reservationId });
    }

    // ==================== MOCK IMPLEMENTATIONS ====================

    /**
     * Mock: Get all products
     */
    async _mockGetProducts() {
        await this._simulateDelay();

        // Simulate occasional timeout (5% chance)
        if (Math.random() < 0.05) {
            return {
                success: false,
                error: {
                    status: HTTP_STATUS.TIMEOUT,
                    message: 'Inventory service timeout - demonstrating gremlin latency',
                    type: 'timeout',
                },
                status: HTTP_STATUS.TIMEOUT,
            };
        }

        return {
            success: true,
            data: PRODUCTS_INVENTORY,
            status: HTTP_STATUS.OK,
        };
    }

    /**
     * Mock: Get product by ID
     */
    async _mockGetProductById(productId) {
        await this._simulateDelay();

        const product = PRODUCTS_INVENTORY.find(p => p.id === productId);

        if (!product) {
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
            data: product,
            status: HTTP_STATUS.OK,
        };
    }

    /**
     * Mock: Check stock availability
     */
    async _mockCheckStock(productId, quantity) {
        await this._simulateDelay();

        const product = PRODUCTS_INVENTORY.find(p => p.id === productId);

        if (!product) {
            return {
                success: false,
                error: {
                    status: HTTP_STATUS.NOT_FOUND,
                    message: ERROR_MESSAGES.NOT_FOUND,
                },
                status: HTTP_STATUS.NOT_FOUND,
            };
        }

        const available = product.stock >= quantity;

        return {
            success: true,
            data: {
                productId,
                requestedQuantity: quantity,
                availableStock: product.stock,
                available,
            },
            status: HTTP_STATUS.OK,
        };
    }

    /**
     * Mock: Reserve stock
     */
    async _mockReserveStock(items) {
        await this._simulateDelay();

        // Simulate gremlin latency (15% chance of delay)
        if (Math.random() < 0.15) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Extra 2s delay
        }

        // Check if all items are available
        const unavailableItems = [];
        for (const item of items) {
            const product = PRODUCTS_INVENTORY.find(p => p.id === item.productId);
            if (!product || product.stock < item.quantity) {
                unavailableItems.push({
                    productId: item.productId,
                    requested: item.quantity,
                    available: product ? product.stock : 0,
                });
            }
        }

        if (unavailableItems.length > 0) {
            return {
                success: false,
                error: {
                    status: HTTP_STATUS.CONFLICT,
                    message: 'Insufficient stock for some items',
                    type: 'stock_conflict',
                    details: unavailableItems,
                },
                status: HTTP_STATUS.CONFLICT,
            };
        }

        // Create reservation
        const reservationId = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        return {
            success: true,
            data: {
                reservationId,
                items,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
            },
            status: HTTP_STATUS.CREATED,
        };
    }

    /**
     * Mock: Release stock reservation
     */
    async _mockReleaseStock(reservationId) {
        await this._simulateDelay();

        return {
            success: true,
            data: {
                reservationId,
                releasedAt: new Date().toISOString(),
            },
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
const inventoryService = new InventoryService(inventoryServiceClient);
