import { useCart } from '../../contexts/CartContext';

export const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity) => {
    const qty = parseInt(newQuantity);
    if (!isNaN(qty) && qty >= 0) {
      updateQuantity(item.id, qty);
    }
  };

  return (
    <div className="flex gap-4 py-4 border-b border-gray-200">
      <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
        <span className="text-2xl font-bold text-primary-600">
          {item.title.charAt(0)}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 truncate">
          {item.title}
        </h3>
        <p className="text-sm text-gray-600 mt-1">${item.price.toFixed(2)}</p>

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            className="w-7 h-7 rounded-md border border-gray-300 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <span className="text-gray-600">−</span>
          </button>
          <input
            type="number"
            min="0"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="w-14 text-center border border-gray-300 rounded-md py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            className="w-7 h-7 rounded-md border border-gray-300 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <span className="text-gray-600">+</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between">
        <button
          onClick={() => removeFromCart(item.id)}
          className="text-red-500 hover:text-red-700 transition-colors"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
        <p className="text-sm font-semibold text-gray-900">
          ${(item.price * item.quantity).toFixed(2)}
        </p>
      </div>
    </div>
  );
};
