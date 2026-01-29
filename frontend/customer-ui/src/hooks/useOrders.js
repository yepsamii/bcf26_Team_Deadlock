import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrder } from '../api/orderService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hooks for order operations
 */

// Create order mutation
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { getToken, user } = useAuth();

  return useMutation({
    mutationFn: ({ productId, quantity }) => {
      const token = getToken();
      const userId = user?.id;

      if (!token || !userId) {
        throw new Error('User not authenticated');
      }

      return createOrder(userId, productId, quantity, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
