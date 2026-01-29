import { useProducts } from '../../hooks/useInventory';
import { ProductCard } from './ProductCard';

export const ProductList = () => {
  const { data: products, isLoading, isError, error } = useProducts();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Products</h3>
        <p className="text-red-700">
          {error?.message || 'Unable to fetch products. Please try again later.'}
        </p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Available</h3>
        <p className="text-gray-600">Check back later for new inventory.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Available Products</h2>
        <p className="text-gray-600 mt-2">Browse our inventory and add items to your cart</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
