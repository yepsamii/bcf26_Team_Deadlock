import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { useLogin, useRegister } from '../../hooks/useAuth';

export const AuthView = () => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState('login');

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const handleLogin = (credentials) => {
    loginMutation.mutate(credentials, {
      onSuccess: () => {
        navigate('/dashboard');
      },
    });
  };

  const handleRegister = (userData) => {
    registerMutation.mutate(userData, {
      onSuccess: () => {
        navigate('/dashboard');
      },
    });
  };

  const switchMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    // Clear errors when switching
    loginMutation.reset();
    registerMutation.reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Valerix</h1>
          <p className="text-gray-600">E-Commerce Platform</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-xl card-shadow-lg p-8 border border-gray-100">
          {/* Tab Headers */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => authMode === 'register' && switchMode()}
              className={`pb-3 px-1 font-medium text-sm transition-colors relative ${
                authMode === 'login' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
              {authMode === 'login' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>}
            </button>
            <button
              onClick={() => authMode === 'login' && switchMode()}
              className={`pb-3 px-1 font-medium text-sm transition-colors relative ${
                authMode === 'register' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
              {authMode === 'register' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>}
            </button>
          </div>

          {/* Forms */}
          {authMode === 'login' ? (
            <LoginForm
              onSubmit={handleLogin}
              isLoading={loginMutation.isPending}
              error={loginMutation.error?.message}
            />
          ) : (
            <RegisterForm
              onSubmit={handleRegister}
              isLoading={registerMutation.isPending}
              error={registerMutation.error?.message}
            />
          )}
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs font-medium text-blue-900 mb-2">Demo Credentials:</p>
          <p className="text-xs text-blue-700">Email: demo@valerix.com</p>
          <p className="text-xs text-blue-700">Password: demo</p>
        </div>
      </div>
    </div>
  );
};
