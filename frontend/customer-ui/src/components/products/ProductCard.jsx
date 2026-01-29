import { useState } from 'react';
import { useReserveProduct } from '../../hooks/useInventory';

export const ProductCard = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const reserveProductMutation = useReserveProduct();

  const handleReserve = async () => {
    if (quantity > 0 && quantity <= product.available_quantity) {
      try {
        await reserveProductMutation.mutateAsync({
          productId: product.id,
          quantity: parseInt(quantity),
        });
        setQuantity(1);
      } catch (error) {
        console.error('Failed to reserve product:', error);
      }
    }
  };

  const isOutOfStock = product.available_quantity === 0;
  const maxQuantity = Math.min(product.available_quantity, 10);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.title}</h3>
        <p className="text-2xl font-bold text-primary-600">${product.price.toFixed(2)}</p>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Available:</span>
          <span className={`font-medium ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
            {product.available_quantity} units
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Reserved:</span>
          <span className="font-medium text-gray-900">{product.reserved} units</span>
        </div>
      </div>

      {!isOutOfStock && (
        <div className="flex gap-2 items-center">
          <select
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={reserveProductMutation.isPending}
          >
            {[...Array(maxQuantity)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <button
            onClick={handleReserve}
            disabled={reserveProductMutation.isPending || isOutOfStock}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {reserveProductMutation.isPending ? 'Reserving...' : 'Reserve'}
          </button>
        </div>
      )}

      {isOutOfStock && (
        <div className="text-center py-2 bg-red-50 rounded-lg">
          <span className="text-red-600 font-medium text-sm">Out of Stock</span>
        </div>
      )}

      {reserveProductMutation.isError && (
        <div className="mt-2 text-sm text-red-600">
          Failed to reserve product. Please try again.
        </div>
      )}
    </div>
  );
};
