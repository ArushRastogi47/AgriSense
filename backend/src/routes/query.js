const express = require('express');
const router = express.Router();

const { createQuery, getResponseById } = require('../controllers/queryController');

// POST /api/query
router.post('/query', createQuery);

// GET /api/response/:id
router.get('/response/:id', getResponseById);

module.exports = router;


