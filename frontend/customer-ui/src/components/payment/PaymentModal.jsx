import { useState } from 'react';
import { PaymentForm } from './PaymentForm';
import { useProcessPayment } from '../../hooks/usePayment';
import { v4 as uuidv4 } from 'uuid';

export const PaymentModal = ({ isOpen, onClose, amount, onSuccess, userId }) => {
  const [paymentResult, setPaymentResult] = useState(null);
  const processPaymentMutation = useProcessPayment();

  if (!isOpen) return null;

  const handlePaymentSubmit = async (cardData) => {
    try {
      const orderId = uuidv4();
      const paymentData = {
        order_id: orderId,
        user_id: userId || uuidv4(),
        amount,
        ...cardData,
      };

      const result = await processPaymentMutation.mutateAsync(paymentData);
      setPaymentResult(result);

      if (result.success) {
        // Delay before calling onSuccess to show success message
        setTimeout(() => {
          onSuccess?.(result);
          handleClose();
        }, 2000);
      }
    } catch (error) {
      setPaymentResult({
        success: false,
        message: error.message || 'Payment failed. Please try again.',
      });
    }
  };

  const handleClose = () => {
    setPaymentResult(null);
    processPaymentMutation.reset();
    onClose();
  };

  const handleRetry = () => {
    setPaymentResult(null);
    processPaymentMutation.reset();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {paymentResult ? (paymentResult.success ? 'Payment Successful' : 'Payment Failed') : 'Payment'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {paymentResult ? (
              <div className="text-center">
                {paymentResult.success ? (
                  <>
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      {paymentResult.message}
                    </p>
                    {paymentResult.payment && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Transaction ID: {paymentResult.payment.transaction_id}</p>
                        <p>
                          Card: {paymentResult.payment.card_brand} ****{paymentResult.payment.card_last_four}
                        </p>
                        <p>Amount: ${paymentResult.payment.amount.toFixed(2)}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      Payment Failed
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      {paymentResult.message}
                    </p>
                    <button
                      onClick={handleRetry}
                      className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Amount Display */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-3xl font-bold text-gray-900">${amount?.toFixed(2) || '0.00'}</p>
                </div>

                {/* Payment Form */}
                <PaymentForm
                  onSubmit={handlePaymentSubmit}
                  isLoading={processPaymentMutation.isPending}
                  amount={amount}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
