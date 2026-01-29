require('dotenv').config();
const express = require('express');
// const { connectPostgres } = require('./config/pgdb');
const authRoutes = require('./routes/authRoutes');
const morgan = require('morgan');

// Connect to databases
// connectPostgres();

const app = express();

// Middleware
app.use(express.json());
app.use(morgan('tiny'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('Auth Service is running !!');
});

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
