const mongoose = require('mongoose');

const kbSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

const KnowledgeBase = mongoose.model('KnowledgeBase', kbSchema);
module.exports = { KnowledgeBase };


