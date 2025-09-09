const axios = require('axios');
const { Scheme } = require('../models/Scheme');

async function getWeather(req, res) {
  try {
    const { location } = req.params;
    if (!location) return res.status(400).json({ error: 'location is required' });

    // Geocode the location to lat/lon
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
    const { data: geo } = await axios.get(geoUrl, { timeout: 10000 });
    const place = geo?.results?.[0];
    if (!place) return res.status(404).json({ error: 'location not found' });

    const latitude = place.latitude;
    const longitude = place.longitude;

    // Fetch forecast: hourly and daily, include humidity and precip probability
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=auto&hourly=temperature_2m,relative_humidity_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7`;
    const { data: wx } = await axios.get(forecastUrl, { timeout: 12000 });

    // Build current snapshot from nearest hour
    const nowIso = new Date().toISOString().slice(0, 13) + ':00';
    const hTimes = wx?.hourly?.time || [];
    const idx = hTimes.indexOf(nowIso);
    const current = {
      temperature_c: idx >= 0 ? wx?.hourly?.temperature_2m?.[idx] : null,
      relative_humidity: idx >= 0 ? wx?.hourly?.relative_humidity_2m?.[idx] : null,
      precipitation_probability: idx >= 0 ? wx?.hourly?.precipitation_probability?.[idx] : null
    };

    const daily = (wx?.daily?.time || []).map((t, i) => ({
      date: t,
      temp_max_c: wx?.daily?.temperature_2m_max?.[i] ?? null,
      temp_min_c: wx?.daily?.temperature_2m_min?.[i] ?? null,
      precip_probability_max: wx?.daily?.precipitation_probability_max?.[i] ?? null
    }));

    res.json({
      location: {
        query: location,
        name: place.name,
        country: place.country,
        latitude,
        longitude
      },
      current,
      daily
    });
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


