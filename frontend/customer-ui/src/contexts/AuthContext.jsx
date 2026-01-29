import { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/react-query';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Initialize auth state from session storage on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem('valerix_token');
    const storedUser = sessionStorage.getItem('valerix_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        // Clear invalid data
        sessionStorage.removeItem('valerix_token');
        sessionStorage.removeItem('valerix_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (authData) => {
    const { token: newToken, user: newUser } = authData;

    // Store in session storage (not localStorage)
    sessionStorage.setItem('valerix_token', newToken);
    sessionStorage.setItem('valerix_user', JSON.stringify(newUser));

    // Update state
    setToken(newToken);
    setUser(newUser);

    // Update query cache
    queryClient.setQueryData(queryKeys.currentUser, newUser);
  };

  const logout = () => {
    // Clear session storage
    sessionStorage.removeItem('valerix_token');
    sessionStorage.removeItem('valerix_user');

    // Clear state
    setToken(null);
    setUser(null);

    // Clear all queries
    queryClient.clear();
  };

  const isAuthenticated = () => {
    return !!(token && user);
  };

  const getToken = () => {
    return token;
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
