const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testGeminiAPI() {
  console.log('🔑 Testing Gemini API Key...');
  console.log('API Key present:', !!process.env.GEMINI_API_KEY);
  console.log('API Key (first 10 chars):', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');

  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ No Gemini API key found in environment variables');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log('✅ Gemini client initialized');
    
    // Test with a simple prompt
    const prompt = "Hello, can you help farmers with agricultural advice?";
    console.log('📝 Testing with prompt:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API test successful!');
    console.log('🤖 Response:', text.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.error('💡 The API key appears to be invalid. Please check your Gemini API key.');
    } else if (error.message.includes('quota')) {
      console.error('💡 API quota exceeded. Check your Gemini API usage limits.');
    } else if (error.message.includes('permission')) {
      console.error('💡 Permission denied. Make sure the API key has proper permissions.');
    }
  }
}

testGeminiAPI();