const express = require('express');
const router = express.Router();

const { createQuery, getResponseById } = require('../controllers/queryController');
const { testAI } = require('../services/aiService');

// Test AI endpoint
router.get('/test-ai', async (req, res) => {
  try {
    console.log('🧪 Testing AI service...');
    const testResult = await testAI();
    res.json(testResult);
  } catch (error) {
    console.error('AI test error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test basic endpoint
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Query routes are working',
    timestamp: new Date().toISOString()
  });
});

// POST /api/query - Create a new query
router.post('/', createQuery);

// GET /api/query/response/:id - Get response by ID  
router.get('/response/:id', getResponseById);

module.exports = router;


