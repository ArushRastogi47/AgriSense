const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    eligibility: { type: String, default: '' },
    link: { type: String, default: '' },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Scheme = mongoose.model('Scheme', schemeSchema);
module.exports = { Scheme };


