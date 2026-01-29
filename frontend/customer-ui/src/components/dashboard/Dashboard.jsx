import { useAuth } from '../../contexts/AuthContext';
import { useLogout } from '../../hooks/useAuth';
import { ProductList } from '../products/ProductList';
import { CartSidebar } from '../cart/CartSidebar';

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
      <header className="bg-white border-b border-gray-300 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Valerix</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-600 font-semibold hidden sm:inline">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-xs font-semibold text-gray-700 border border-gray-300 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6 flex gap-6">
        {/* Products Section - Left Side */}
        <div className="flex-1">
          <ProductList />
        </div>

        {/* Cart Sidebar - Right Side */}
        <div className="w-80 flex-shrink-0">
          <CartSidebar />
        </div>
      </main>
    </div>
  );
};
