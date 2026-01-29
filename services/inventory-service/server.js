require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5002;
const morgan = require('morgan');
const inventoryRouter = require('./routes');

app.use(express.json());
app.use(morgan('tiny'));

app.get('/health', (req, res) => {
    res.status(200).send('Inventory Service is running !');
});

app.use('/api/v1/inventory', inventoryRouter);

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));