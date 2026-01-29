import { useCart } from '../../contexts/CartContext';

export const CartButton = () => {
  const { getCartItemsCount, setIsCartOpen } = useCart();
  const itemCount = getCartItemsCount();

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className="relative p-3 hover:bg-gray-100 rounded-xl transition-all hover:scale-105 active:scale-95"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-gray-700"
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
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
};
