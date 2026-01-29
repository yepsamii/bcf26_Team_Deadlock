import { useAuth } from '../../contexts/AuthContext';
import { useLogout } from '../../hooks/useAuth';
import { useProducts } from '../../hooks/useInventory';
import { ProductList } from '../products/ProductList';
import { CartButton } from '../cart/CartButton';
import { CartDrawer } from '../cart/CartDrawer';

export const Dashboard = () => {
  const { user } = useAuth();
  const logout = useLogout();
  const { data: products } = useProducts();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-primary-50/30">
      <CartDrawer />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">V</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Valerix</h1>
            </div>
            <div className="flex items-center gap-5">
              <CartButton />
              <span className="text-sm text-gray-600 font-medium hidden sm:inline">Welcome, {user?.email}</span>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Dashboard Stats */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600 text-lg mb-8">Welcome to your Valerix customer portal</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stat Card 1 */}
            <div className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Orders</h3>
              <p className="text-4xl font-bold text-gray-900">0</p>
            </div>

            {/* Stat Card 2 */}
            <div className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Active Orders</h3>
              <p className="text-4xl font-bold text-gray-900">0</p>
            </div>

            {/* Stat Card 3 */}
            <div className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Products Available</h3>
              <p className="text-4xl font-bold text-gray-900">{products?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-12">
          <ProductList />
        </div>

        {/* User Info */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 font-medium mb-1">Email</span>
              <span className="text-base font-semibold text-gray-900">{user?.email}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 font-medium mb-1">User ID</span>
              <span className="text-base font-semibold text-gray-900">{user?.id}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 font-medium mb-1">Account Created</span>
              <span className="text-base font-semibold text-gray-900">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
