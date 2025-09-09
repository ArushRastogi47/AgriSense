const { Query } = require('../models/Query');
const { generateAIResponse } = require('../services/aiService');

async function createQuery(req, res) {
  try {
    const { userId, text, roomId } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const query = await Query.create({ userId: userId || null, text, status: 'pending' });

    // Fire-and-forget AI generation
    generateAIResponse({ queryId: query._id, text, roomId }).catch(() => {});

    res.status(201).json({ id: query._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to create query' });
  }
}

async function getResponseById(req, res) {
  try {
    const { id } = req.params;
    const query = await Query.findById(id);
    if (!query) return res.status(404).json({ error: 'not found' });
    res.json({ id: query._id, status: query.status, response: query.response });
  } catch (err) {
    res.status(500).json({ error: 'failed to fetch response' });
  }
}

module.exports = { createQuery, getResponseById };


