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
    <div className="flex gap-5 p-5 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all">
      <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-primary-50 to-primary-200 rounded-xl flex items-center justify-center shadow-sm">
        <span className="text-3xl font-bold text-primary-600">
          {item.title.charAt(0)}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-gray-900 truncate mb-1">
          {item.title}
        </h3>
        <p className="text-lg font-semibold text-primary-600 mb-3">${item.price.toFixed(2)}</p>

        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1.5 w-fit">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 flex items-center justify-center transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>

          <div className="w-12 text-center">
            <span className="text-lg font-bold text-gray-900">{item.quantity}</span>
          </div>

          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 flex items-center justify-center transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between">
        <button
          onClick={() => removeFromCart(item.id)}
          className="w-9 h-9 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-all flex items-center justify-center"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
        <p className="text-xl font-bold text-gray-900">
          ${(item.price * item.quantity).toFixed(2)}
        </p>
      </div>
    </div>
  );
};
