// HTTP Client with timeout and error handling

/**
 * HTTP Client Options
 * @typedef {Object} RequestOptions
 * @property {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @property {Object} [headers] - Request headers
 * @property {Object|FormData} [body] - Request body
 * @property {number} [timeout] - Request timeout in milliseconds (default: 5000)
 * @property {AbortSignal} [signal] - AbortSignal for cancellation
 */

/**
 * API Response
 * @typedef {Object} APIResponse
 * @property {boolean} success - Whether the request was successful
 * @property {*} [data] - Response data if successful
 * @property {Object} [error] - Error object if failed
 * @property {number} [status] - HTTP status code
 */

class HTTPClient {
    constructor(baseURL, defaultTimeout = 5000) {
        this.baseURL = baseURL;
        this.defaultTimeout = defaultTimeout;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    /**
     * Make an HTTP request with timeout support
     * @param {string} endpoint - API endpoint
     * @param {RequestOptions} options - Request options
     * @returns {Promise<APIResponse>}
     */
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            headers = {},
            body,
            timeout = this.defaultTimeout,
            signal,
        } = options;

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            // Simulate network delay if enabled
            if (FEATURE_FLAGS.SIMULATE_NETWORK_DELAY) {
                await this._simulateDelay(FEATURE_FLAGS.NETWORK_DELAY_MS);
            }

            const url = `${this.baseURL}${endpoint}`;
            const requestOptions = {
                method,
                headers: {
                    ...this.defaultHeaders,
                    ...headers,
                },
                signal: signal || controller.signal,
            };

            // Add body for non-GET requests
            if (body && method !== 'GET') {
                requestOptions.body = body instanceof FormData
                    ? body
                    : JSON.stringify(body);
            }

            const response = await fetch(url, requestOptions);
            clearTimeout(timeoutId);

            // Parse response
            const data = await this._parseResponse(response);

            if (!response.ok) {
                return {
                    success: false,
                    error: {
                        status: response.status,
                        message: data.message || ERROR_MESSAGES.SERVER_ERROR,
                        details: data,
                    },
                    status: response.status,
                };
            }

            return {
                success: true,
                data,
                status: response.status,
            };

        } catch (error) {
            clearTimeout(timeoutId);
            return this._handleError(error);
        }
    }

    /**
     * GET request
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    }

    /**
     * PUT request
     */
    async put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    }

    /**
     * DELETE request
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    /**
     * PATCH request
     */
    async patch(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PATCH', body });
    }

    /**
     * Parse response based on content type
     */
    async _parseResponse(response) {
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }

        return response.text();
    }

    /**
     * Handle errors uniformly
     */
    _handleError(error) {
        if (error.name === 'AbortError') {
            return {
                success: false,
                error: {
                    status: HTTP_STATUS.TIMEOUT,
                    message: ERROR_MESSAGES.TIMEOUT,
                    type: 'timeout',
                },
                status: HTTP_STATUS.TIMEOUT,
            };
        }

        if (error.message === 'Failed to fetch') {
            return {
                success: false,
                error: {
                    status: 0,
                    message: ERROR_MESSAGES.NETWORK_ERROR,
                    type: 'network',
                },
                status: 0,
            };
        }

        return {
            success: false,
            error: {
                status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
                message: error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
                type: 'unknown',
            },
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        };
    }

    /**
     * Simulate network delay for testing
     */
    async _simulateDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Set authentication token
     */
    setAuthToken(token) {
        if (token) {
            this.defaultHeaders['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.defaultHeaders['Authorization'];
        }
    }
}

// Create client instances for each service
const orderServiceClient = new HTTPClient(API_CONFIG.ORDER_SERVICE_URL);
const inventoryServiceClient = new HTTPClient(API_CONFIG.INVENTORY_SERVICE_URL);
