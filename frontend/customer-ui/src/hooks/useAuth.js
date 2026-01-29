import { useMutation } from '@tanstack/react-query';
import { authService } from '../api/authService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for login mutation
 */
export const useLogin = () => {
  const { login } = useAuth();

  return useMutation({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: (data) => {
      login(data);
    },
  });
};

/**
 * Hook for register mutation
 */
export const useRegister = () => {
  const { login } = useAuth();

  return useMutation({
    mutationFn: (userData) => authService.register(userData),
    onSuccess: (data) => {
      // Auto login after successful registration
      login(data);
    },
  });
};

/**
 * Hook for logout
 */
export const useLogout = () => {
  const { logout } = useAuth();

  return () => {
    logout();
  };
};
