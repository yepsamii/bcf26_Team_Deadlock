import { inventoryServiceClient } from '../lib/axios';

/**
 * Inventory Service API
 * Handles all inventory-related API calls
 */

// Get all products
export const getAllProducts = async () => {
  const response = await inventoryServiceClient.get('/products');
  return response.data;
};

// Get a single product by ID
export const getProductById = async (productId) => {
  const response = await inventoryServiceClient.get(`/products/${productId}`);
  return response.data;
};

// Reserve product stock
export const reserveProduct = async (productId, quantity) => {
  const response = await inventoryServiceClient.post(`/products/${productId}/reserve`, {
    quantity,
  });
  return response.data;
};

// Release product stock
export const releaseProduct = async (productId, quantity) => {
  const response = await inventoryServiceClient.post(`/products/${productId}/release`, {
    quantity,
  });
  return response.data;
};

// Health check
export const checkInventoryHealth = async () => {
  const response = await inventoryServiceClient.get('/health');
  return response.data;
};
