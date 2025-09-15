const { Query } = require('../models/Query');
const { KnowledgeBase } = require('../models/KnowledgeBase');
const { getIo } = require('../utils/io');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

// Initialize Gemini AI with your API key
let genAI = null;
let model = null;

console.log('🔑 Checking Gemini API Key...');
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log('✅ Gemini AI initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error.message);
  }
} else {
  console.warn('⚠️ Gemini API Key not found or not configured');
}

async function retrieveContext(userText) {
  const terms = userText.split(/\s+/).filter(Boolean).slice(0, 5);
  const found = await KnowledgeBase.find({ tags: { $in: terms } }).limit(3).lean();
  return found.map((d) => `${d.title}: ${d.content}`).join('\n\n');
}

async function generateAIResponse({ queryId, text, roomId }) {
  try {
    console.log(`🤖 Generating AI response for query: ${text.substring(0, 50)}...`);
    
    const context = await retrieveContext(text);
    const prompt = `You are Krishi Mitra, an expert agricultural assistant helping Indian farmers. Provide practical, actionable advice in simple language. Keep responses helpful but concise (2-3 sentences max).

Context: ${context || 'None'}

Farmer's Question: ${text}

Provide helpful agricultural guidance:`;

    let answer = '';
    if (model) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        answer = response.text();
        console.log('✅ AI response generated successfully');
      } catch (genErr) {
        console.error('❌ AI Generation Error:', genErr);
        answer = getFallbackResponse(text);
      }
    } else {
      console.log('⚠️ Gemini API not configured - using fallback');
      answer = getFallbackResponse(text);
    }

    if (!answer) {
      answer = getFallbackResponse(text);
    }
    
    // Update database
    await Query.findByIdAndUpdate(queryId, { response: answer, status: 'answered' });
    
    // Send real-time response via socket
    const io = getIo();
    if (io && roomId) {
      console.log(`📤 Sending response to room ${roomId}`);
      io.to(roomId).emit('assistant_message', { text: answer });
    }
    
    return answer;
  } catch (err) {
    console.error('❌ Error in generateAIResponse:', err);
    await Query.findByIdAndUpdate(queryId, { status: 'error' });
    throw err;
  }
}

function getFallbackResponse(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('weather') || lowerText.includes('rain') || lowerText.includes('climate')) {
    return "For accurate weather information, I recommend checking your local meteorological department or weather apps. Consider seasonal patterns and plan your farming activities accordingly.";
  }
  
  if (lowerText.includes('crop') || lowerText.includes('plant') || lowerText.includes('seed')) {
    return "For crop-specific advice, consult your local Krishi Vigyan Kendra (KVK) or agricultural extension officer. They can provide region-specific guidance based on your soil and climate conditions.";
  }
  
  if (lowerText.includes('pest') || lowerText.includes('disease') || lowerText.includes('insect')) {
    return "For pest and disease management, it's best to consult with local agricultural experts who can identify the specific issue and recommend appropriate organic or chemical treatments.";
  }
  
  return "Thank you for your agricultural question. For the most accurate advice, I recommend consulting your local Krishi Vigyan Kendra or agricultural extension officer who can provide region-specific guidance.";
}

// Add a simple test function
async function testAI(query = "What crops are good for monsoon season?") {
  try {
    if (!model) {
      return { success: false, message: 'AI service not configured - API key missing' };
    }
    
    const result = await model.generateContent(query);
    const response = await result.response;
    return { success: true, response: response.text() };
  } catch (error) {
    console.error('AI test error:', error);
    return { success: false, message: error.message };
  }
}

// Simple AI response for real-time chat (no database)
async function generateChatResponse(text) {
  try {
    console.log(`🤖 Generating chat response for: ${text.substring(0, 50)}...`);
    
    const context = await retrieveContext(text);
    const prompt = `You are Krishi Mitra, an expert agricultural assistant helping Indian farmers. Provide practical, actionable advice in simple language. Keep responses helpful but concise (2-3 sentences max).

Context: ${context || 'None'}

Farmer's Question: ${text}

Provide helpful agricultural guidance:`;

    let answer = '';
    if (model) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        answer = response.text();
        console.log('✅ Chat response generated successfully');
      } catch (genErr) {
        console.error('❌ AI Generation Error:', genErr);
        answer = getFallbackResponse(text);
      }
    } else {
      console.log('⚠️ Gemini API not configured - using fallback');
      answer = getFallbackResponse(text);
    }

    if (!answer) {
      answer = getFallbackResponse(text);
    }
    
    return answer;
  } catch (err) {
    console.error('❌ Error in generateChatResponse:', err);
    return getFallbackResponse(text);
  }
}

module.exports = { generateAIResponse, generateChatResponse, testAI };


