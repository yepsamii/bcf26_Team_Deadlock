const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authMiddleware = require('./middleware/authMiddleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001/api/auth';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:5002/api/v1/inventory';

app.use(cors());


// Auth service proxy
const authServiceProxy = createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
});

// Inventory service proxy
const inventoryServiceProxy = createProxyMiddleware({
    target: INVENTORY_SERVICE_URL,
    changeOrigin: true,
});


// Routes
app.use('/auth', authServiceProxy);
app.use('/inventory', authMiddleware, inventoryServiceProxy);
app.get('/health', (req, res) => {
    res.json({ message: "API Gateway is running !!" });
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
