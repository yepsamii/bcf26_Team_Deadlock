import axios from 'axios';
import { config } from '../config/env';

/**
 * Create axios instance for Auth Service
 */
export const authServiceClient = axios.create({
  baseURL: config.authServiceURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Create axios instance for Order Service
 */
export const orderServiceClient = axios.create({
  baseURL: config.orderServiceURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Create axios instance for Inventory Service
 */
export const inventoryServiceClient = axios.create({
  baseURL: config.inventoryServiceURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Create axios instance for Payment Service
 */
export const paymentServiceClient = axios.create({
  baseURL: config.paymentServiceURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add auth token and simulate delay
 */
const requestInterceptor = async (config) => {
  // Simulate network delay if enabled
  if (import.meta.env.VITE_SIMULATE_NETWORK_DELAY === 'true') {
    const delay = parseInt(import.meta.env.VITE_NETWORK_DELAY_MS || '500', 10);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return config;
};

/**
 * Response interceptor - Handle errors uniformly
 */
const responseInterceptor = (response) => {
  return response;
};

/**
 * Error interceptor - Transform errors to consistent format
 */
const errorInterceptor = (error) => {
  if (error.response) {
    // Server responded with error status
    return Promise.reject({
      status: error.response.status,
      message: error.response.data?.message || error.message,
      data: error.response.data,
    });
  } else if (error.request) {
    // Request made but no response
    return Promise.reject({
      status: 0,
      message: 'Network error. Please check your connection.',
      data: null,
    });
  } else {
    // Something else happened
    return Promise.reject({
      status: 0,
      message: error.message || 'An unexpected error occurred.',
      data: null,
    });
  }
};

// Apply interceptors to all clients
[authServiceClient, orderServiceClient, inventoryServiceClient, paymentServiceClient].forEach((client) => {
  client.interceptors.request.use(requestInterceptor);
  client.interceptors.response.use(responseInterceptor, errorInterceptor);
});
