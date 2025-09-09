const { Query } = require('../models/Query');
const { KnowledgeBase } = require('../models/KnowledgeBase');
const { getIo } = require('../utils/io');

// Placeholder local LLM adapter. Replace with GPT4All/Mistral bindings as needed.
async function runLocalLLM(prompt) {
  // For now, echo with simple KB retrieval
  return `Assistant (stub): ${prompt}`;
}

async function retrieveContext(userText) {
  const terms = userText.split(/\s+/).filter(Boolean).slice(0, 5);
  const found = await KnowledgeBase.find({ tags: { $in: terms } }).limit(3).lean();
  return found.map((d) => `${d.title}: ${d.content}`).join('\n\n');
}

async function generateAIResponse({ queryId, text, roomId }) {
  try {
    const context = await retrieveContext(text);
    const prompt = `Context:\n${context}\n\nQuestion: ${text}\nAnswer:`;
    const answer = await runLocalLLM(prompt);
    await Query.findByIdAndUpdate(queryId, { response: answer, status: 'answered' });
    const io = getIo();
    if (io && roomId) {
      io.to(roomId).emit('assistant_message', { roomId, text: answer });
    }
  } catch (err) {
    await Query.findByIdAndUpdate(queryId, { status: 'error' });
  }
}

module.exports = { generateAIResponse };


