// Order Card Component
function OrderCard({ order, onViewDetails }) {
    const { useState } = React;
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white rounded-xl card-shadow overflow-hidden hover:shadow-lg transition-shadow">
            {/* Order Header */}
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{order.id}</h3>
                            <StatusBadge status={order.status} />
                        </div>
                        <p className="text-sm text-gray-500">
                            {formatOrderDate(order.date)} at {formatOrderTime(order.date)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</p>
                    </div>
                </div>

                {/* Order Items Preview */}
                <div className="flex items-center gap-2 mb-4">
                    {order.items.slice(0, 4).map((item, index) => (
                        <div
                            key={index}
                            className="w-10 h-10 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg flex items-center justify-center"
                            title={item.name}
                        >
                            <span className="text-xl">{item.image}</span>
                        </div>
                    ))}
                    {order.items.length > 4 && (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-600 font-medium">+{order.items.length - 4}</span>
                        </div>
                    )}
                </div>

                {/* Note/Warning */}
                {order.note && (
                    <div className={`p-3 rounded-lg mb-4 ${
                        order.status === 'error' || order.status === 'timeout'
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-blue-50 border border-blue-200'
                    }`}>
                        <p className={`text-sm ${
                            order.status === 'error' || order.status === 'timeout'
                                ? 'text-red-700'
                                : 'text-blue-700'
                        }`}>
                            {order.note}
                        </p>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex-1 px-4 py-2 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg hover:bg-primary-100 transition-colors"
                    >
                        {expanded ? 'Hide Details' : 'View Details'}
                    </button>
                    {order.trackingNumber && (
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                            Track Order
                        </button>
                    )}
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                    {/* Order Items */}
                    <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Items</h4>
                        <div className="space-y-3">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg flex items-center justify-center">
                                            <span className="text-2xl">{item.image}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Timeline</h4>
                        <div className="space-y-3">
                            {order.timeline.map((step, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                                        step.completed ? 'bg-green-500' : 'bg-gray-300'
                                    }`}></div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${
                                            step.completed ? 'text-gray-900' : 'text-gray-400'
                                        }`}>
                                            {step.status}
                                        </p>
                                        {step.date && (
                                            <p className="text-xs text-gray-500">
                                                {new Date(step.date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: 'numeric',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Shipping Address</h4>
                            <p className="text-sm text-gray-600">{order.shippingAddress}</p>
                        </div>
                        {order.trackingNumber && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Tracking Number</h4>
                                <p className="text-sm font-mono text-primary-600">{order.trackingNumber}</p>
                            </div>
                        )}
                        {order.estimatedDelivery && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Estimated Delivery</h4>
                                <p className="text-sm text-gray-600">
                                    {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
