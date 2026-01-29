const express = require('express');
const inventoryRouter = express.Router();

inventoryRouter.get('/', (req, res) => {
    res.status(200).json({ message: 'Some inventory data !' });
});

module.exports = inventoryRouter;