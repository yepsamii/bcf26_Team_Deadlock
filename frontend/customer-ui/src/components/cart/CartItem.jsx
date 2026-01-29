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
    <div className="border border-gray-300 bg-gray-50 p-2">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 flex-1">
          {item.title}
        </h3>
        <button
          onClick={() => removeFromCart(item.id)}
          className="ml-2 text-red-600 hover:text-red-800"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <p className="text-sm font-bold text-gray-900 mb-2">${item.price.toFixed(2)}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 border border-gray-300 bg-white">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            className="w-6 h-6 hover:bg-gray-100 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>

          <div className="w-8 text-center border-x border-gray-300">
            <span className="text-sm font-bold text-gray-900">{item.quantity}</span>
          </div>

          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            className="w-6 h-6 hover:bg-gray-100 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <p className="text-sm font-bold text-gray-900">
          ${(item.price * item.quantity).toFixed(2)}
        </p>
      </div>
    </div>
  );
};
