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
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-primary-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
      {/* Product Image */}
      <div className="relative h-56 bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 flex items-center justify-center overflow-hidden">
        <div className="text-7xl font-bold text-primary-300 group-hover:scale-110 transition-transform duration-300">
          {product.title.charAt(0)}
        </div>

        {/* Stock Badge */}
        {isOutOfStock ? (
          <div className="absolute top-4 right-4 bg-red-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
            Out of Stock
          </div>
        ) : isLowStock ? (
          <div className="absolute top-4 right-4 bg-orange-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
            Low Stock
          </div>
        ) : (
          <div className="absolute top-4 right-4 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
            In Stock
          </div>
        )}

        {/* Success Badge */}
        {showSuccess && (
          <div className="absolute inset-0 bg-emerald-500/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in duration-300">
            <div className="text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="font-bold text-lg">Added to Cart!</p>
            </div>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem]">
          {product.title}
        </h3>

        {/* Price & Stock */}
        <div className="flex items-baseline justify-between mb-6">
          <div className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            ${product.price.toFixed(2)}
          </div>
          <div className="text-sm font-medium text-gray-500">
            {product.available_quantity} available
          </div>
        </div>

        {/* Add to Cart */}
        {!isOutOfStock ? (
          <div className="space-y-4">
            {/* Quantity Selector */}
            <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-xl p-2">
              <button
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="w-10 h-10 rounded-lg bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-sm hover:shadow"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>

              <div className="w-16 text-center">
                <div className="text-2xl font-bold text-gray-900">{quantity}</div>
                <div className="text-xs text-gray-500 font-medium">Qty</div>
              </div>

              <button
                onClick={handleIncrement}
                disabled={quantity >= maxQuantity}
                className="w-10 h-10 rounded-lg bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-sm hover:shadow"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3.5 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
          <div className="text-center py-4 bg-red-50 rounded-xl border border-red-100">
            <span className="text-red-600 font-semibold">Currently Unavailable</span>
          </div>
        )}
      </div>
    </div>
  );
};
