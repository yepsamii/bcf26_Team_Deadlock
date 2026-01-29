const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authMiddleware = require('./middleware/authMiddleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:5002';

app.use(cors());


// Auth service proxy
const authServiceProxy = createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/auth': ''
    }
});

// Inventory service proxy
const inventoryServiceProxy = createProxyMiddleware({
    target: INVENTORY_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/inventory': ''
    }
});

// Products proxy (direct access to inventory service products endpoint)
const productsServiceProxy = createProxyMiddleware({
    target: INVENTORY_SERVICE_URL,
    changeOrigin: true,
});


// Routes
app.use('/auth', authServiceProxy);
app.use('/inventory', inventoryServiceProxy);
app.use('/products', productsServiceProxy);

// Health check endpoint that verifies downstream services
app.get('/health', async (req, res) => {
    const healthChecks = {
        gateway: 'healthy',
        downstream: {}
    };

    // Check Auth Service
    try {
        const authResponse = await fetch(`${AUTH_SERVICE_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        const authData = await authResponse.json();
        healthChecks.downstream.auth = {
            status: authResponse.ok ? 'healthy' : 'unhealthy',
            details: authData
        };
    } catch (error) {
        healthChecks.downstream.auth = {
            status: 'unreachable',
            error: error.message
        };
    }

    // Check Inventory Service
    try {
        const inventoryResponse = await fetch(`${INVENTORY_SERVICE_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        const inventoryData = await inventoryResponse.json();
        healthChecks.downstream.inventory = {
            status: inventoryResponse.ok ? 'healthy' : 'unhealthy',
            details: inventoryData
        };
    } catch (error) {
        healthChecks.downstream.inventory = {
            status: 'unreachable',
            error: error.message
        };
    }

    // Determine overall health
    const allHealthy = Object.values(healthChecks.downstream).every(
        service => service.status === 'healthy'
    );

    const statusCode = allHealthy ? 200 : 503;
    healthChecks.status = allHealthy ? 'healthy' : 'degraded';
    healthChecks.message = allHealthy
        ? 'All downstream services are healthy'
        : 'One or more downstream services are unhealthy';

    res.status(statusCode).json(healthChecks);
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
