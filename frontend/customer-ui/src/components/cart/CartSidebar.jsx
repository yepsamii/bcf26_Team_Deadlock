import { useCart } from '../../contexts/CartContext';
import { CartItem } from './CartItem';
import { useCreateOrder } from '../../hooks/useOrders';
import { useState } from 'react';

export const CartSidebar = () => {
  const { cartItems, getCartTotal, clearCart, removeFromCart } = useCart();
  const createOrderMutation = useCreateOrder();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setIsCheckingOut(true);

    const results = {
      successful: [],
      failed: [],
    };

    try {
      for (const item of cartItems) {
        try {
          const orderResponse = await createOrderMutation.mutateAsync({
            productId: item.id,
            quantity: item.quantity,
          });

          results.successful.push({
            productId: item.id,
            productTitle: item.title,
            orderId: orderResponse.order.id,
          });
        } catch (orderError) {
          console.error('Order creation failed:', orderError);
          results.failed.push({
            productId: item.id,
            productTitle: item.title,
            error: orderError.message || 'Failed to create order',
          });
        }
      }

      if (results.successful.length > 0) {
        results.successful.forEach((result) => {
          removeFromCart(result.productId);
        });
      }

      if (results.failed.length === 0) {
        alert(`Order placed successfully! ${results.successful.length} item(s) ordered.`);
      } else if (results.successful.length > 0) {
        alert(
          `${results.successful.length} item(s) ordered successfully.\n` +
          `${results.failed.length} item(s) failed:\n` +
          results.failed.map((f) => `- ${f.productTitle}: ${f.error}`).join('\n')
        );
      } else {
        alert('Failed to complete order. Please try again.');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="sticky top-20 bg-white border border-gray-300 h-fit">
      {/* Header */}
      <div className="border-b border-gray-300 p-4">
        <h2 className="text-lg font-bold text-gray-900">Cart</h2>
        <p className="text-xs text-gray-600 mt-1">{cartItems.length} items</p>
      </div>

      {/* Cart Items */}
      <div className="max-h-[calc(100vh-400px)] overflow-y-auto p-4">
        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Your cart is empty</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {cartItems.length > 0 && (
        <div className="border-t border-gray-300 p-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-gray-700">
              <span className="font-semibold">Subtotal</span>
              <span className="font-bold">${getCartTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700">
              <span className="font-semibold">Shipping</span>
              <span className="font-bold text-green-600">Free</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-300">
              <span>Total</span>
              <span>${getCartTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full bg-blue-600 text-white py-2.5 text-sm font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? 'Processing...' : 'Checkout'}
            </button>
            <button
              onClick={clearCart}
              disabled={isCheckingOut}
              className="w-full border border-gray-300 text-gray-700 py-2 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
