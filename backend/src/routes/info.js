const express = require('express');
const router = express.Router();

const { getWeather, getMarketPrices, getSchemes } = require('../controllers/infoController');

// GET /api/weather/:location
router.get('/weather/:location', getWeather);

// GET /api/market/:crop
router.get('/market/:crop', getMarketPrices);

// GET /api/schemes
router.get('/schemes', getSchemes);

module.exports = router;


