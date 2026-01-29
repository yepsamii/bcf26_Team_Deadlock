import { orderServiceClient } from '../lib/axios';

/**
 * Order Service API
 * Handles all order-related API calls
 */

// Create a single order
export const createOrder = async (userId, productId, quantity, token) => {
  const response = await orderServiceClient.post('/orders', {
    user_id: userId,
    product_id: productId,
    quantity: quantity,
  }, {
    headers: {
      'Authorization': token,
    },
  });
  return response.data;
};

// Get order by ID (for future use)
export const getOrderById = async (orderId, token) => {
  const response = await orderServiceClient.get(`/orders/${orderId}`, {
    headers: {
      'Authorization': token,
    },
  });
  return response.data;
};

// Health check
export const checkOrderHealth = async () => {
  const response = await orderServiceClient.get('/health');
  return response.data;
};
