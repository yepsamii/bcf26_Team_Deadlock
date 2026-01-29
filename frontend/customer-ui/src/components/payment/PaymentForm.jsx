import { useState } from 'react';

/**
 * Format card number with spaces every 4 digits
 */
const formatCardNumber = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

/**
 * Detect card brand based on first digit
 */
const detectCardBrand = (cardNumber) => {
  const firstDigit = cardNumber.replace(/\D/g, '')[0];
  switch (firstDigit) {
    case '4':
      return 'Visa';
    case '5':
      return 'Mastercard';
    case '3':
      return 'Amex';
    case '6':
      return 'Discover';
    default:
      return null;
  }
};

export const PaymentForm = ({ onSubmit, isLoading, amount }) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
  });
  const [errors, setErrors] = useState({});

  const cardBrand = detectCardBrand(formData.cardNumber);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'cardNumber') {
      setFormData((prev) => ({ ...prev, cardNumber: formatCardNumber(value) }));
    } else if (name === 'expiryMonth') {
      const digits = value.replace(/\D/g, '').slice(0, 2);
      setFormData((prev) => ({ ...prev, expiryMonth: digits }));
    } else if (name === 'expiryYear') {
      const digits = value.replace(/\D/g, '').slice(0, 2);
      setFormData((prev) => ({ ...prev, expiryYear: digits }));
    } else if (name === 'cvv') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      setFormData((prev) => ({ ...prev, cvv: digits }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when field changes
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    const cardDigits = formData.cardNumber.replace(/\D/g, '');
    if (cardDigits.length < 13 || cardDigits.length > 16) {
      newErrors.cardNumber = 'Invalid card number';
    }

    const month = parseInt(formData.expiryMonth, 10);
    if (!formData.expiryMonth || month < 1 || month > 12) {
      newErrors.expiryMonth = 'Invalid month';
    }

    if (!formData.expiryYear || formData.expiryYear.length !== 2) {
      newErrors.expiryYear = 'Invalid year';
    }

    if (formData.cvv.length < 3) {
      newErrors.cvv = 'Invalid CVV';
    }

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      card_number: formData.cardNumber.replace(/\s/g, ''),
      expiry_month: formData.expiryMonth,
      expiry_year: formData.expiryYear,
      cvv: formData.cvv,
      cardholder_name: formData.cardholderName,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Card Number
          {cardBrand && (
            <span className="ml-2 text-xs text-gray-500">({cardBrand})</span>
          )}
        </label>
        <input
          type="text"
          name="cardNumber"
          value={formData.cardNumber}
          onChange={handleChange}
          placeholder="4242 4242 4242 4242"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.cardNumber ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isLoading}
        />
        {errors.cardNumber && (
          <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
        )}
      </div>

      {/* Expiry and CVV Row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Month
          </label>
          <input
            type="text"
            name="expiryMonth"
            value={formData.expiryMonth}
            onChange={handleChange}
            placeholder="MM"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.expiryMonth ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.expiryMonth && (
            <p className="text-red-500 text-xs mt-1">{errors.expiryMonth}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <input
            type="text"
            name="expiryYear"
            value={formData.expiryYear}
            onChange={handleChange}
            placeholder="YY"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.expiryYear ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.expiryYear && (
            <p className="text-red-500 text-xs mt-1">{errors.expiryYear}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CVV
          </label>
          <input
            type="text"
            name="cvv"
            value={formData.cvv}
            onChange={handleChange}
            placeholder="123"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.cvv ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.cvv && (
            <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>
          )}
        </div>
      </div>

      {/* Cardholder Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cardholder Name
        </label>
        <input
          type="text"
          name="cardholderName"
          value={formData.cardholderName}
          onChange={handleChange}
          placeholder="John Doe"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.cardholderName ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isLoading}
        />
        {errors.cardholderName && (
          <p className="text-red-500 text-xs mt-1">{errors.cardholderName}</p>
        )}
      </div>

      {/* Test Card Hint */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        <p className="font-medium">Test Cards:</p>
        <p>Success: 4242 4242 4242 4242</p>
        <p>Decline: 4000 0000 0000 0002</p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Processing...' : `Pay $${amount?.toFixed(2) || '0.00'}`}
      </button>
    </form>
  );
};
