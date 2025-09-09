const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models/User');
const { Query } = require('../models/Query');

async function validateOfficer(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = await User.findOne({ email, role: 'officer' });
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ sub: user._id, role: 'officer' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'login failed' });
  }
}

async function listOfficerQueries(req, res) {
  try {
    const queries = await Query.find({}).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ queries });
  } catch (err) {
    res.status(500).json({ error: 'failed to list queries' });
  }
}

module.exports = { validateOfficer, listOfficerQueries };


