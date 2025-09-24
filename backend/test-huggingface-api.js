const dotenv = require('dotenv');
const { InferenceClient } = require('@huggingface/inference');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🧪 Testing Hugging Face API Integration');
console.log('═══════════════════════════════════════');

const token = process.env.HF_TOKEN;
console.log('HF_TOKEN found:', token ? 'Yes' : 'No');
console.log('Token length:', token ? token.length : 'N/A');
console.log('Token prefix:', token ? token.substring(0, 10) + '...' : 'N/A');

if (!token) {
  console.error('❌ HF_TOKEN not found in environment variables');
  process.exit(1);
}

async function testHuggingFaceAPI() {
  try {
    console.log('\n🚀 Initializing Hugging Face Client...');
    const client = new InferenceClient(token);
    
    // Test 1: Simple text classification to verify token
    console.log('\n📝 Test 1: Simple Text Classification');
    try {
      const textResult = await client.textClassification({
        model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
        inputs: 'This is a test message'
      });
      console.log('✅ Text classification successful:', textResult);
    } catch (error) {
      console.error('❌ Text classification failed:', error.message);
      if (error.message.includes('401')) {
        console.error('🔑 Authentication issue - token may be invalid');
        return;
      }
    }
    
    // Test 2: Plant disease model availability
    console.log('\n🌱 Test 2: Checking Plant Disease Model');
    const modelName = 'linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification';
    
    try {
      // Create a dummy image buffer (1x1 pixel image)
      const dummyImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      
      console.log('🖼️  Testing with dummy image buffer...');
      const result = await client.imageClassification({
        data: dummyImageBuffer,
        model: modelName,
      });
      
      console.log('✅ Plant disease model test successful!');
      console.log('Result structure:', JSON.stringify(result, null, 2));
      
      if (Array.isArray(result) && result.length > 0) {
        console.log('📊 Top predictions:');
        result.slice(0, 3).forEach((pred, idx) => {
          console.log(`  ${idx + 1}. ${pred.label}: ${(pred.score * 100).toFixed(2)}%`);
        });
      }
      
    } catch (error) {
      console.error('❌ Plant disease model test failed:', error.message);
      
      if (error.message.includes('503') || error.message.includes('loading')) {
        console.log('⏳ Model is currently loading. This is normal for first-time usage.');
        console.log('💡 Try again in a few minutes.');
      } else if (error.message.includes('401')) {
        console.error('🔑 Authentication failed - check your token');
      } else if (error.message.includes('404')) {
        console.error('📷 Model not found or not accessible');
      } else {
        console.error('🔧 Unexpected error:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize Hugging Face client:', error.message);
  }
}

// Test 3: Verify token format
function verifyTokenFormat() {
  console.log('\n🔍 Test 3: Token Format Verification');
  
  if (!token.startsWith('hf_')) {
    console.warn('⚠️  Token should start with "hf_"');
    return false;
  }
  
  if (token.length < 30) {
    console.warn('⚠️  Token seems too short');
    return false;
  }
  
  console.log('✅ Token format looks correct');
  return true;
}

async function main() {
  verifyTokenFormat();
  await testHuggingFaceAPI();
  
  console.log('\n📋 Summary:');
  console.log('═══════════════════════════════════════');
  console.log('• Check the logs above for any authentication errors');
  console.log('• If model is loading (503 error), wait a few minutes');
  console.log('• If authentication fails (401), verify your HF token');
  console.log('• The PlantDiseaseService should work once the model loads');
}

main().catch(console.error);