// Static Order History Data
const ORDERS_HISTORY = [
    {
        id: 'ORD-001234',
        date: '2026-01-28T10:30:00',
        status: 'delivered',
        total: 799.98,
        items: [
            { productId: 1, name: 'Gaming Console X', quantity: 1, price: 499.99, image: '🎮' },
            { productId: 2, name: 'Wireless Headphones', quantity: 1, price: 299.99, image: '🎧' }
        ],
        shippingAddress: '123 Main St, New York, NY 10001',
        trackingNumber: 'TRK-9876543210',
        estimatedDelivery: '2026-01-30',
        timeline: [
            { status: 'Order Placed', date: '2026-01-28T10:30:00', completed: true },
            { status: 'Processing', date: '2026-01-28T14:00:00', completed: true },
            { status: 'Shipped', date: '2026-01-29T08:00:00', completed: true },
            { status: 'Out for Delivery', date: '2026-01-30T06:00:00', completed: true },
            { status: 'Delivered', date: '2026-01-30T15:30:00', completed: true }
        ]
    },
    {
        id: 'ORD-001235',
        date: '2026-01-27T15:45:00',
        status: 'shipped',
        total: 559.98,
        items: [
            { productId: 3, name: 'Smart Watch Pro', quantity: 1, price: 399.99, image: '⌚' },
            { productId: 6, name: 'Mechanical Keyboard', quantity: 1, price: 159.99, image: '⌨️' }
        ],
        shippingAddress: '456 Oak Ave, Los Angeles, CA 90001',
        trackingNumber: 'TRK-9876543211',
        estimatedDelivery: '2026-01-31',
        timeline: [
            { status: 'Order Placed', date: '2026-01-27T15:45:00', completed: true },
            { status: 'Processing', date: '2026-01-27T18:00:00', completed: true },
            { status: 'Shipped', date: '2026-01-28T10:00:00', completed: true },
            { status: 'Out for Delivery', date: '2026-01-31T06:00:00', completed: false },
            { status: 'Delivered', date: null, completed: false }
        ]
    },
    {
        id: 'ORD-001236',
        date: '2026-01-29T09:15:00',
        status: 'processing',
        total: 229.98,
        items: [
            { productId: 4, name: 'Laptop Backpack', quantity: 2, price: 79.99, image: '🎒' },
            { productId: 2, name: 'Wireless Headphones', quantity: 1, price: 299.99, image: '🎧' }
        ],
        shippingAddress: '789 Elm St, Chicago, IL 60601',
        trackingNumber: null,
        estimatedDelivery: '2026-02-02',
        timeline: [
            { status: 'Order Placed', date: '2026-01-29T09:15:00', completed: true },
            { status: 'Processing', date: '2026-01-29T09:15:00', completed: true },
            { status: 'Shipped', date: null, completed: false },
            { status: 'Out for Delivery', date: null, completed: false },
            { status: 'Delivered', date: null, completed: false }
        ]
    },
    {
        id: 'ORD-001237',
        date: '2026-01-26T13:20:00',
        status: 'timeout',
        total: 149.99,
        items: [
            { productId: 5, name: '4K Webcam', quantity: 1, price: 149.99, image: '📷' }
        ],
        shippingAddress: '321 Pine Rd, Seattle, WA 98101',
        trackingNumber: null,
        estimatedDelivery: null,
        timeline: [
            { status: 'Order Placed', date: '2026-01-26T13:20:00', completed: true },
            { status: 'Processing', date: null, completed: false },
            { status: 'Shipped', date: null, completed: false },
            { status: 'Out for Delivery', date: null, completed: false },
            { status: 'Delivered', date: null, completed: false }
        ],
        note: 'Order timed out due to inventory service delay. Please contact support.'
    },
    {
        id: 'ORD-001238',
        date: '2026-01-25T11:00:00',
        status: 'cancelled',
        total: 499.99,
        items: [
            { productId: 1, name: 'Gaming Console X', quantity: 1, price: 499.99, image: '🎮' }
        ],
        shippingAddress: '555 Maple Dr, Boston, MA 02101',
        trackingNumber: null,
        estimatedDelivery: null,
        timeline: [
            { status: 'Order Placed', date: '2026-01-25T11:00:00', completed: true },
            { status: 'Cancelled', date: '2026-01-25T11:30:00', completed: true }
        ],
        note: 'Cancelled by customer'
    },
    {
        id: 'ORD-001239',
        date: '2026-01-24T16:30:00',
        status: 'error',
        total: 959.96,
        items: [
            { productId: 3, name: 'Smart Watch Pro', quantity: 2, price: 399.99, image: '⌚' },
            { productId: 6, name: 'Mechanical Keyboard', quantity: 1, price: 159.99, image: '⌨️' }
        ],
        shippingAddress: '888 Cedar Ln, Austin, TX 78701',
        trackingNumber: null,
        estimatedDelivery: null,
        timeline: [
            { status: 'Order Placed', date: '2026-01-24T16:30:00', completed: true },
            { status: 'Processing', date: '2026-01-24T16:30:00', completed: true },
            { status: 'Error', date: '2026-01-24T16:35:00', completed: true }
        ],
        note: 'Payment processing failed. Please update payment method.'
    }
];

// Get status color and label
function getOrderStatusInfo(status) {
    const statusMap = {
        delivered: {
            label: 'Delivered',
            color: 'green',
            bgClass: 'bg-green-50',
            textClass: 'text-green-700',
            borderClass: 'border-green-200'
        },
        shipped: {
            label: 'Shipped',
            color: 'blue',
            bgClass: 'bg-blue-50',
            textClass: 'text-blue-700',
            borderClass: 'border-blue-200'
        },
        processing: {
            label: 'Processing',
            color: 'yellow',
            bgClass: 'bg-yellow-50',
            textClass: 'text-yellow-700',
            borderClass: 'border-yellow-200'
        },
        timeout: {
            label: 'Timeout',
            color: 'orange',
            bgClass: 'bg-orange-50',
            textClass: 'text-orange-700',
            borderClass: 'border-orange-200'
        },
        cancelled: {
            label: 'Cancelled',
            color: 'gray',
            bgClass: 'bg-gray-50',
            textClass: 'text-gray-700',
            borderClass: 'border-gray-200'
        },
        error: {
            label: 'Error',
            color: 'red',
            bgClass: 'bg-red-50',
            textClass: 'text-red-700',
            borderClass: 'border-red-200'
        }
    };

    return statusMap[status] || statusMap.processing;
}

// Format date
function formatOrderDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

// Format time
function formatOrderTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
