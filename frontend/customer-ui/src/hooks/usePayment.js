import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { processPayment, getPayment, getPaymentByOrderId } from '../api/paymentService';

/**
 * Hook for processing a payment
 * @returns {Object} Mutation object for processing payment
 */
export const useProcessPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: processPayment,
    onSuccess: (data) => {
      // Invalidate payment queries on success
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};

/**
 * Hook for fetching a payment by ID
 * @param {string} paymentId - Payment ID
 * @param {Object} options - Query options
 * @returns {Object} Query object for payment
 */
export const usePayment = (paymentId, options = {}) => {
  return useQuery({
    queryKey: ['payments', paymentId],
    queryFn: () => getPayment(paymentId),
    enabled: !!paymentId,
    ...options,
  });
};

/**
 * Hook for fetching a payment by order ID
 * @param {string} orderId - Order ID
 * @param {Object} options - Query options
 * @returns {Object} Query object for payment
 */
export const usePaymentByOrderId = (orderId, options = {}) => {
  return useQuery({
    queryKey: ['payments', 'order', orderId],
    queryFn: () => getPaymentByOrderId(orderId),
    enabled: !!orderId,
    ...options,
  });
};
