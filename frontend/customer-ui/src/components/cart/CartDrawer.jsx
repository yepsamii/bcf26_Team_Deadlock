import { useCart } from '../../contexts/CartContext';
import { CartItem } from './CartItem';
import { useReserveProduct } from '../../hooks/useInventory';
import { useCreateOrder } from '../../hooks/useOrders';
import { useState } from 'react';

export const CartDrawer = () => {
  const { cartItems, isCartOpen, setIsCartOpen, getCartTotal, clearCart, removeFromCart } = useCart();
  const reserveProductMutation = useReserveProduct();
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
      // Process each cart item sequentially
      for (const item of cartItems) {
        try {
          // Step 1: Create order
          const orderResponse = await createOrderMutation.mutateAsync({
            productId: item.id,
            quantity: item.quantity,
          });

          // Step 2: Reserve inventory (if order creation succeeds)
          try {
            await reserveProductMutation.mutateAsync({
              productId: item.id,
              quantity: item.quantity,
            });

            // Both operations succeeded
            results.successful.push({
              productId: item.id,
              productTitle: item.title,
              orderId: orderResponse.order.id,
            });
          } catch (inventoryError) {
            // Order created but inventory reservation failed
            console.error('Inventory reservation failed:', inventoryError);
            results.failed.push({
              productId: item.id,
              productTitle: item.title,
              error: inventoryError.message || 'Failed to reserve inventory',
              orderCreated: true,
              orderId: orderResponse.order.id,
            });
          }
        } catch (orderError) {
          // Order creation failed
          console.error('Order creation failed:', orderError);
          results.failed.push({
            productId: item.id,
            productTitle: item.title,
            error: orderError.message || 'Failed to create order',
            orderCreated: false,
          });
        }
      }

      // Handle results
      if (results.successful.length > 0) {
        // Remove successful items from cart
        results.successful.forEach((result) => {
          removeFromCart(result.productId);
        });
      }

      // Show user feedback
      if (results.failed.length === 0) {
        // All succeeded
        alert(`Order placed successfully! ${results.successful.length} item(s) ordered.`);
      } else if (results.successful.length > 0) {
        // Partial success
        alert(
          `${results.successful.length} item(s) ordered successfully.\n` +
          `${results.failed.length} item(s) failed:\n` +
          results.failed.map((f) => `- ${f.productTitle}: ${f.error}`).join('\n')
        );
      } else {
        // All failed
        alert('Failed to complete order. Please try again.');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all animate-in fade-in duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Floating Cart Card */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-2xl max-h-[90vh] bg-white shadow-2xl z-50 flex flex-col rounded-3xl animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-8 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Shopping Cart</h2>
            <p className="text-sm text-gray-500 mt-1">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Your cart is empty
              </h3>
              <p className="text-gray-500">
                Add some products to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-100 p-8 pt-6 bg-gradient-to-b from-white to-gray-50">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span className="font-medium">Subtotal</span>
                <span className="font-semibold">${getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="font-medium">Shipping</span>
                <span className="font-semibold text-emerald-600">Free</span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-gray-900 pt-3 border-t-2 border-gray-200">
                <span>Total</span>
                <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                  ${getCartTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={clearCart}
                disabled={isCheckingOut}
                className="px-6 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Clear
              </button>
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3.5 rounded-xl font-bold hover:from-primary-700 hover:to-primary-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                {isCheckingOut ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Proceed to Checkout'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
