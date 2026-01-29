import { authServiceClient } from '../lib/axios';
import { endpoints, config } from '../config/env';

/**
 * Mock user database for development
 */
const MOCK_USERS = [
  {
    id: 'mock_1',
    email: 'john@example.com',
    password: 'password123',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mock_2',
    email: 'jane@example.com',
    password: 'password123',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mock_3',
    email: 'demo@valerix.com',
    password: 'demo',
    created_at: '2024-01-01T00:00:00Z',
  },
];

/**
 * Simulate network delay
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock login implementation
 */
const mockLogin = async (credentials) => {
  await delay(Math.random() * 500 + 300);

  const user = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === credentials.email.toLowerCase() && u.password === credentials.password
  );

  if (!user) {
    throw {
      status: 401,
      message: 'Invalid email or password',
      data: null,
    };
  }

  const { password, ...userWithoutPassword } = user;
  const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    token,
    user: userWithoutPassword,
  };
};

/**
 * Mock register implementation
 */
const mockRegister = async (userData) => {
  await delay(Math.random() * 500 + 300);

  const existingUser = MOCK_USERS.find((u) => u.email.toLowerCase() === userData.email.toLowerCase());

  if (existingUser) {
    throw {
      status: 409,
      message: 'Email already exists',
      data: null,
    };
  }

  const newUser = {
    id: `mock_${Date.now()}`,
    email: userData.email,
    created_at: new Date().toISOString(),
  };

  const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add to mock database (in-memory only)
  MOCK_USERS.push({ ...newUser, password: userData.password });

  return {
    token,
    user: newUser,
  };
};

/**
 * Auth Service API
 */
export const authService = {
  /**
   * Login user
   */
  login: async (credentials) => {
    if (config.useMockData) {
      return mockLogin(credentials);
    }

    const response = await authServiceClient.post(endpoints.auth.login, credentials);
    return response.data;
  },

  /**
   * Register new user
   */
  register: async (userData) => {
    if (config.useMockData) {
      return mockRegister(userData);
    }

    const response = await authServiceClient.post(endpoints.auth.register, userData);
    return response.data;
  },

  /**
   * Health check
   */
  health: async () => {
    const response = await authServiceClient.get(endpoints.auth.health);
    return response.data;
  },
};
