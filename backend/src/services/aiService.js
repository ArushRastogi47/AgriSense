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

// Retry mechanism with exponential backoff
async function callWithRetry(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      // If it's a 503 (service unavailable) or rate limit error, retry
      if ((error.status === 503 || error.status === 429 || error.message.includes('overloaded')) && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's the last attempt or non-retryable error, throw
      throw error;
    }
  }
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
        answer = await callWithRetry(async () => {
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text();
        });
        console.log('✅ AI response generated successfully');
      } catch (genErr) {
        console.error('❌ AI Generation Error after retries:', genErr);
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
  
  // Weather-related queries
  if (lowerText.includes('weather') || lowerText.includes('rain') || lowerText.includes('climate')) {
    return "🌤️ Monitor weather patterns regularly using reliable apps or IMD forecasts. Plan sowing and harvesting based on monsoon predictions. Ensure proper drainage during heavy rains and irrigation during dry spells.";
  }
  
  // Kerala-specific crops
  if (lowerText.includes('kerala') || lowerText.includes('coconut') || lowerText.includes('pepper') || lowerText.includes('cardamom')) {
    return "🌴 Kerala's tropical climate is ideal for coconut, pepper, cardamom, rubber, and spices. Focus on organic farming, proper spacing, and intercropping. Consult local KVK for variety-specific guidance.";
  }
  
  // Crop and planting queries
  if (lowerText.includes('crop') || lowerText.includes('plant') || lowerText.includes('seed') || lowerText.includes('sow')) {
    return "🌱 Choose crops based on your soil type, climate, and market demand. Ensure good quality seeds, proper spacing, and timely sowing. Consider crop rotation for soil health. Contact your local agricultural officer for region-specific varieties.";
  }
  
  // Pest and disease queries
  if (lowerText.includes('pest') || lowerText.includes('disease') || lowerText.includes('insect') || lowerText.includes('fungus')) {
    return "🐛 Early identification is key for pest management. Use integrated pest management (IPM) combining biological, cultural, and chemical methods. Neem-based solutions are effective for many pests. Consult agricultural experts for severe infestations.";
  }
  
  // Soil-related queries
  if (lowerText.includes('soil') || lowerText.includes('fertilizer') || lowerText.includes('nutrient')) {
    return "🌾 Regular soil testing helps determine nutrient needs. Use organic compost and balanced fertilizers. Maintain soil pH between 6.0-7.5 for most crops. Add organic matter to improve soil structure and water retention.";
  }
  
  // Water and irrigation
  if (lowerText.includes('water') || lowerText.includes('irrigation') || lowerText.includes('drip')) {
    return "💧 Efficient water management is crucial. Consider drip irrigation for water conservation. Water early morning or evening to reduce evaporation. Monitor soil moisture and adjust irrigation based on crop stage and weather.";
  }
  
  // Marketing and price queries
  if (lowerText.includes('price') || lowerText.includes('market') || lowerText.includes('sell')) {
    return "💰 Check current market prices through e-NAM portal or local mandis. Build relationships with buyers and consider direct marketing. Add value through processing if possible. Store properly to avoid post-harvest losses.";
  }
  
  // Default response
  return "🌾 Thank you for your agricultural question! While I'm currently experiencing high demand, here are some general tips: Follow good agricultural practices, consult your local Krishi Vigyan Kendra (KVK), and use modern farming techniques for better yields. Feel free to ask again!";
}

// Add a simple test function
async function testAI(query = "What crops are good for monsoon season?") {
  try {
    if (!model) {
      return { success: false, message: 'AI service not configured - API key missing' };
    }
    
    const response = await callWithRetry(async () => {
      const result = await model.generateContent(query);
      const response = await result.response;
      return response.text();
    });
    
    return { success: true, response };
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
        answer = await callWithRetry(async () => {
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text();
        });
        console.log('✅ Chat response generated successfully');
      } catch (genErr) {
        console.error('❌ AI Generation Error after retries:', genErr);
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


