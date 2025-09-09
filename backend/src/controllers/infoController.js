const axios = require('axios');
const { Scheme } = require('../models/Scheme');

async function getWeather(req, res) {
  try {
    const { location } = req.params;
    // Placeholder: use open-meteo free API without key
    const url = `https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.20&current_weather=true`;
    const { data } = await axios.get(url);
    res.json({ location, weather: data.current_weather });
  } catch (err) {
    res.status(500).json({ error: 'failed to fetch weather' });
  }
}

async function getMarketPrices(req, res) {
  try {
    const { crop } = req.params;
    // Placeholder: mock response, replace with actual market API if available
    res.json({ crop, pricePerQuintalINR: 2500, source: 'mock' });
  } catch (err) {
    res.status(500).json({ error: 'failed to fetch market prices' });
  }
}

async function getSchemes(req, res) {
  try {
    const schemes = await Scheme.find({ active: true }).lean();
    res.json({ schemes });
  } catch (err) {
    res.status(500).json({ error: 'failed to fetch schemes' });
  }
}

module.exports = { getWeather, getMarketPrices, getSchemes };


