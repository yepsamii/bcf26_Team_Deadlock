// Real-time Data Simulation for Customer Portal

// Simulate order status progression
function simulateOrderStatusProgression(currentStatus) {
    const statusFlow = {
        'processing': { next: 'shipped', chance: 0.1 },
        'shipped': { next: 'delivered', chance: 0.05 },
        'delivered': { next: 'delivered', chance: 0 },
        'timeout': { next: 'processing', chance: 0.3 }, // Recovery from timeout
        'error': { next: 'processing', chance: 0.2 }, // Recovery from error
        'cancelled': { next: 'cancelled', chance: 0 }
    };

    const flow = statusFlow[currentStatus];
    if (!flow) return currentStatus;

    // Random chance to progress to next status
    if (Math.random() < flow.chance) {
        return flow.next;
    }

    // Small chance to encounter timeout or error
    if (currentStatus === 'processing' && Math.random() < 0.02) {
        return Math.random() < 0.6 ? 'timeout' : 'error';
    }

    return currentStatus;
}

// Generate new order
function generateNewOrder(userId, products) {
    const statuses = ['processing', 'processing', 'processing', 'shipped']; // Favor processing
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    // Select 1-3 random products
    const numItems = Math.floor(Math.random() * 3) + 1;
    const selectedProducts = [];
    const usedIndices = new Set();

    while (selectedProducts.length < numItems) {
        const index = Math.floor(Math.random() * products.length);
        if (!usedIndices.has(index) && products[index].stock > 0) {
            usedIndices.add(index);
            selectedProducts.push({
                ...products[index],
                quantity: Math.floor(Math.random() * 3) + 1
            });
        }
    }

    const subtotal = selectedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 5.99;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const orderDate = new Date();

    return {
        id: Date.now(),
        orderNumber,
        date: orderDate.toISOString(),
        status,
        items: selectedProducts,
        subtotal,
        shipping,
        tax,
        total,
        timeline: generateOrderTimeline(status, orderDate),
        shippingAddress: {
            name: 'John Doe',
            street: '123 Main Street',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
            country: 'USA'
        },
        trackingNumber: `VLX${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        estimatedDelivery: new Date(Date.now() + (Math.random() * 5 + 2) * 24 * 60 * 60 * 1000).toISOString()
    };
}

// Generate timeline based on status
function generateOrderTimeline(status, orderDate) {
    const timeline = [
        {
            status: 'processing',
            label: 'Order Placed',
            timestamp: orderDate.toISOString(),
            completed: true
        }
    ];

    if (['shipped', 'delivered', 'timeout', 'error'].includes(status)) {
        timeline.push({
            status: 'processing',
            label: 'Processing',
            timestamp: new Date(orderDate.getTime() + 30 * 60 * 1000).toISOString(),
            completed: true
        });
    }

    if (status === 'shipped' || status === 'delivered') {
        timeline.push({
            status: 'shipped',
            label: 'Shipped',
            timestamp: new Date(orderDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            completed: status === 'delivered' || status === 'shipped'
        });
    }

    if (status === 'delivered') {
        timeline.push({
            status: 'delivered',
            label: 'Delivered',
            timestamp: new Date(orderDate.getTime() + 72 * 60 * 60 * 1000).toISOString(),
            completed: true
        });
    }

    if (status === 'timeout') {
        timeline.push({
            status: 'timeout',
            label: 'Timeout',
            timestamp: new Date(orderDate.getTime() + 60 * 60 * 1000).toISOString(),
            completed: false,
            note: 'Inventory service timed out. Retrying...'
        });
    }

    if (status === 'error') {
        timeline.push({
            status: 'error',
            label: 'Error',
            timestamp: new Date(orderDate.getTime() + 45 * 60 * 1000).toISOString(),
            completed: false,
            note: 'System error occurred. Our team is investigating.'
        });
    }

    return timeline;
}

// Update product stock levels
function updateProductStock(products) {
    return products.map(product => {
        // Randomly decrease stock (simulating sales)
        if (product.stock > 0 && Math.random() < 0.1) {
            const decrease = Math.floor(Math.random() * 3) + 1;
            return {
                ...product,
                stock: Math.max(0, product.stock - decrease)
            };
        }

        // Randomly increase stock (simulating restocking)
        if (product.stock < 50 && Math.random() < 0.05) {
            const increase = Math.floor(Math.random() * 20) + 10;
            return {
                ...product,
                stock: product.stock + increase
            };
        }

        return product;
    });
}

// Update order with new status
function updateOrderStatus(order) {
    const newStatus = simulateOrderStatusProgression(order.status);

    if (newStatus === order.status) {
        return order;
    }

    // Update timeline based on new status
    const updatedOrder = {
        ...order,
        status: newStatus,
        timeline: generateOrderTimeline(newStatus, new Date(order.date))
    };

    // Update estimated delivery if shipped
    if (newStatus === 'shipped') {
        updatedOrder.estimatedDelivery = new Date(Date.now() + (Math.random() * 3 + 2) * 24 * 60 * 60 * 1000).toISOString();
    }

    return updatedOrder;
}
