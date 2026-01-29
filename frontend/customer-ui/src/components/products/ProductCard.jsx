import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';

export const ProductCard = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (quantity > 0 && quantity <= product.available_quantity) {
      addToCart(product, parseInt(quantity));
      if (onAddToCart) {
        onAddToCart(product.title, quantity);
      }
      setQuantity(1);
    }
  };

  const isOutOfStock = product.available_quantity === 0;
  const maxQuantity = Math.min(product.available_quantity, 10);
  const isLowStock = product.available_quantity > 0 && product.available_quantity <= 5;

  const handleIncrement = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className="bg-white border border-gray-300 overflow-hidden">
      {/* Available Count - Highest Priority */}
      <div className="bg-gray-100 border-b border-gray-300 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600 uppercase">Stock</span>
          <span className={`text-sm font-bold ${isOutOfStock ? 'text-red-600' : 'text-gray-900'}`}>
            {product.available_quantity} units
          </span>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.title}
        </h3>

        <div className="text-xl font-bold text-gray-900 mb-3">
          ${product.price.toFixed(2)}
        </div>

        {/* Add to Cart */}
        {!isOutOfStock ? (
          <div className="space-y-2">
            {/* Quantity Selector */}
            <div className="flex items-center gap-2 border border-gray-300 p-1">
              <button
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="w-8 h-8 bg-gray-100 border border-gray-300 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>

              <div className="flex-1 text-center">
                <div className="text-lg font-bold text-gray-900">{quantity}</div>
              </div>

              <button
                onClick={handleIncrement}
                disabled={quantity >= maxQuantity}
                className="w-8 h-8 bg-gray-100 border border-gray-300 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Add to Cart
            </button>
          </div>
        ) : (
          <div className="text-center py-2 bg-red-100 border border-red-300">
            <span className="text-red-700 font-semibold text-sm">Out of Stock</span>
          </div>
        )}
      </div>
    </div>
  );
};
