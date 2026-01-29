/**
 * Environment Configuration
 *
 * All environment variables are accessed through import.meta.env
 * and must be prefixed with VITE_
 */

export const config = {
  // API URLs
  authServiceURL: import.meta.env.VITE_AUTH_SERVICE_URL || 'http://13.212.182.34/api/auth',
  orderServiceURL: import.meta.env.VITE_ORDER_SERVICE_URL || 'http://13.212.182.34/api/orders',
  inventoryServiceURL: import.meta.env.VITE_INVENTORY_SERVICE_URL ||'http://13.212.182.34/api/inventory',

  // Feature Flags
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  simulateNetworkDelay: import.meta.env.VITE_SIMULATE_NETWORK_DELAY === 'true',
  networkDelayMs: parseInt(import.meta.env.VITE_NETWORK_DELAY_MS || '500', 10),
};

export const endpoints = {
  // Auth Service
  auth: {
    register: '/register',
    login: '/login',
    health: '/health',
  },

  // Order Service
  orders: {
    list: '/api/orders',
    create: '/api/orders',
    getById: (id) => `/api/orders/${id}`,
    updateStatus: (id) => `/api/orders/${id}/status`,
    cancel: (id) => `/api/orders/${id}/cancel`,
  },

  // Inventory Service
  inventory: {
    list: '/products',
    getById: (id) => `/products/${id}`,
    reserve: (id) => `/products/${id}/reserve`,
    release: (id) => `/products/${id}/release`,
    health: '/health',
  },

  // Health Checks
  health: {
    authService: '/health',
    orderService: '/health',
    inventoryService: '/health',
  },
};

export const httpStatus = {
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

export const errorMessages = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'Resource not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_ERROR: 'Invalid data provided.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};
