import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';

export const ProductCard = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (quantity > 0 && quantity <= product.available_quantity) {
      addToCart(product, parseInt(quantity));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setQuantity(1);
    }
  };

  const isOutOfStock = product.available_quantity === 0;
  const maxQuantity = Math.min(product.available_quantity, 10);
  const isLowStock = product.available_quantity > 0 && product.available_quantity <= 5;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Product Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary-100 via-primary-200 to-primary-300 flex items-center justify-center overflow-hidden">
        <div className="text-6xl font-bold text-white opacity-80">
          {product.title.charAt(0)}
        </div>

        {/* Stock Badge */}
        {isOutOfStock ? (
          <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            Out of Stock
          </div>
        ) : isLowStock ? (
          <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Low Stock
          </div>
        ) : (
          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            In Stock
          </div>
        )}

        {/* Success Badge */}
        {showSuccess && (
          <div className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center">
            <div className="text-white text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="font-semibold">Added to Cart!</p>
            </div>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
          {product.title}
        </h3>

        {/* Price */}
        <div className="mb-4">
          <p className="text-3xl font-bold text-primary-600">
            ${product.price.toFixed(2)}
          </p>
        </div>

        {/* Stock Info */}
        <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Available:</span>
            <span className={`font-semibold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
              {product.available_quantity} units
            </span>
          </div>
          {product.reserved > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Reserved:</span>
              <span className="font-medium text-gray-500">{product.reserved} units</span>
            </div>
          )}
        </div>

        {/* Add to Cart */}
        {!isOutOfStock ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Qty:</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                {[...Array(maxQuantity)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 active:bg-primary-800 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Add to Cart
            </button>
          </div>
        ) : (
          <div className="text-center py-3 bg-red-50 rounded-lg border border-red-200">
            <span className="text-red-700 font-semibold text-sm">Currently Unavailable</span>
          </div>
        )}
      </div>
    </div>
  );
};
