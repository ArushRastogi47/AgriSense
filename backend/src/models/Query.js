const mongoose = require('mongoose');

const querySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    text: { type: String, required: true },
    response: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'answered', 'error'], default: 'pending' },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

const Query = mongoose.model('Query', querySchema);
module.exports = { Query };


