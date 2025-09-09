const { Query } = require('../models/Query');
const { KnowledgeBase } = require('../models/KnowledgeBase');
const { getIo } = require('../utils/io');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// Gemini configuration for REST API
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const geminiModelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModelName}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;

async function retrieveContext(userText) {
  const terms = userText.split(/\s+/).filter(Boolean).slice(0, 5);
  const found = await KnowledgeBase.find({ tags: { $in: terms } }).limit(3).lean();
  return found.map((d) => `${d.title}: ${d.content}`).join('\n\n');
}

async function generateAIResponse({ queryId, text, roomId }) {
  try {
    const context = await retrieveContext(text);
    const prompt = `You are an agricultural assistant. Use the provided context if relevant.\n\nContext:\n${context || 'None'}\n\nQuestion: ${text}\n\nAnswer:`;

    let answer = '';
    if (geminiApiKey) {
      try {
        const { data } = await axios.post(
          geminiEndpoint,
          {
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }]
              }
            ]
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 20000
          }
        );
        answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (genErr) {
        answer = '';
      }
    }

    if (!answer) {
      answer = `I'm currently unable to fetch an AI response. Please try again later.`;
    }
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


