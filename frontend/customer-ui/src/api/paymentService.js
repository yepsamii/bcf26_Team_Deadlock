import { paymentServiceClient } from '../lib/axios';

/**
 * Process a payment
 * @param {Object} paymentData - Payment details
 * @param {string} paymentData.order_id - Order ID
 * @param {string} paymentData.user_id - User ID
 * @param {number} paymentData.amount - Payment amount
 * @param {string} paymentData.card_number - Card number
 * @param {string} paymentData.expiry_month - Expiry month
 * @param {string} paymentData.expiry_year - Expiry year
 * @param {string} paymentData.cvv - CVV
 * @param {string} paymentData.cardholder_name - Cardholder name
 * @returns {Promise<Object>} Payment response
 */
export const processPayment = async (paymentData) => {
  const response = await paymentServiceClient.post('/payments', paymentData);
  return response.data;
};

/**
 * Get payment by ID
 * @param {string} paymentId - Payment ID
 * @returns {Promise<Object>} Payment details
 */
export const getPayment = async (paymentId) => {
  const response = await paymentServiceClient.get(`/payments/${paymentId}`);
  return response.data;
};

/**
 * Get payment by order ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Payment details
 */
export const getPaymentByOrderId = async (orderId) => {
  const response = await paymentServiceClient.get(`/payments/order/${orderId}`);
  return response.data;
};
