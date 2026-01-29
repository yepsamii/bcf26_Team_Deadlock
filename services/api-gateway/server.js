const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authMiddleware = require('./middleware/authMiddleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:5002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:5003';

app.use(cors());


// Auth service proxy
const authServiceProxy = createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/auth': ''
    }
});

// Inventory service proxy
const inventoryServiceProxy = createProxyMiddleware({
    target: INVENTORY_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/inventory': ''
    }
});

// Orders service proxy
const ordersServiceProxy = createProxyMiddleware({
    target: ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/orders': ''
    }
});

// Health check proxy
const ordersHealthCheckProxy = createProxyMiddleware({
    target: ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/orders/health': '/health'
    }
});

// Routes
app.use('/api/auth', authServiceProxy);
app.use('/api/inventory', inventoryServiceProxy);
app.use('/api/orders/health', ordersHealthCheckProxy);
app.use('/api/orders', authMiddleware, ordersServiceProxy);
app.get('/api/health', (req, res) => {
    res.json({ message: "API Gateway is running !!" });
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
