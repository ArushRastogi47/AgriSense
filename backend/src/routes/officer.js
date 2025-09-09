const express = require('express');
const router = express.Router();

const { validateOfficer, listOfficerQueries } = require('../controllers/officerController');
const { authMiddleware } = require('../utils/auth');

// POST /api/officer/validate
router.post('/validate', validateOfficer);

// GET /api/officer/queries
router.get('/queries', authMiddleware, listOfficerQueries);

module.exports = router;


