import { useAuth } from '../../contexts/AuthContext';
import { useLogout } from '../../hooks/useAuth';

export const Dashboard = () => {
  const { user } = useAuth();
  const logout = useLogout();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Valerix</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl card-shadow p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
          <p className="text-gray-600 mb-6">Welcome to your Valerix customer portal.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stat Card 1 */}
            <div className="p-6 bg-primary-50 rounded-lg border border-primary-100">
              <h3 className="text-sm font-medium text-primary-900 mb-2">Total Orders</h3>
              <p className="text-3xl font-bold text-primary-600">0</p>
            </div>

            {/* Stat Card 2 */}
            <div className="p-6 bg-green-50 rounded-lg border border-green-100">
              <h3 className="text-sm font-medium text-green-900 mb-2">Active Orders</h3>
              <p className="text-3xl font-bold text-green-600">0</p>
            </div>

            {/* Stat Card 3 */}
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Products Available</h3>
              <p className="text-3xl font-bold text-blue-600">10</p>
            </div>
          </div>

          {/* User Info */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm font-medium text-gray-900">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">User ID:</span>
                <span className="text-sm font-medium text-gray-900">{user?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Account Created:</span>
                <span className="text-sm font-medium text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
