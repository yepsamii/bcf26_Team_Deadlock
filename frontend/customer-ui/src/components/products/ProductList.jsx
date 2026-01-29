import { useProducts } from '../../hooks/useInventory';
import { ProductCard } from './ProductCard';
import { useState } from 'react';
import { Toast } from '../common/Toast';

export const ProductList = () => {
  const { data: products, isLoading, isError, error } = useProducts();
  const [toast, setToast] = useState(null);

  const handleAddToCart = (productTitle, quantity) => {
    setToast(`Added ${quantity}x ${productTitle} to cart`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="text-gray-600 mt-4 font-medium">Loading products...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-100 border border-red-300 p-6 text-center">
        <h3 className="text-lg font-bold text-red-900 mb-2">Failed to Load Products</h3>
        <p className="text-red-700 text-sm">
          {error?.message || 'Unable to fetch products. Please try again later.'}
        </p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="bg-gray-100 border border-gray-300 p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Available</h3>
        <p className="text-gray-600 text-sm">Check back later for new inventory.</p>
      </div>
    );
  }

  return (
    <div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Available Products</h2>
        <p className="text-gray-600 text-sm">Browse inventory and add items to cart</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3  gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
        ))}
      </div>
    </div>
  );
};
