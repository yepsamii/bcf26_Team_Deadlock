// Product Card Component
function ProductCard({ product, onAddToCart }) {
    const stockStatus = product.stock === 0 ? 'out' : product.stock < 10 ? 'low' : 'in';

    return (
        <div className="bg-white rounded-xl card-shadow overflow-hidden hover:shadow-lg transition-shadow">
            {/* Product Image/Icon */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-8 flex items-center justify-center">
                <span className="text-6xl">{product.image}</span>
            </div>

            {/* Product Info */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
                        <p className="text-xs text-gray-500 mb-2">{product.description}</p>
                    </div>
                </div>

                {/* Stock Status */}
                <div className="mb-3">
                    {stockStatus === 'out' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs font-medium rounded">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Out of Stock
                        </span>
                    ) : stockStatus === 'low' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-600 text-xs font-medium rounded">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Only {product.stock} left
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 text-xs font-medium rounded">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            In Stock ({product.stock})
                        </span>
                    )}
                </div>

                {/* Price and Add to Cart */}
                <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">${product.price}</span>
                    <button
                        onClick={() => onAddToCart(product)}
                        disabled={product.stock === 0}
                        className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {product.stock === 0 ? 'Unavailable' : 'Add to Cart'}
                    </button>
                </div>

                {/* SKU */}
                <p className="text-xs text-gray-400 mt-2">SKU: {product.sku}</p>
            </div>
        </div>
    );
}
