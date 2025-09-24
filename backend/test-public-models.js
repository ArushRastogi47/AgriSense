const dotenv = require('dotenv');
const { InferenceClient } = require('@huggingface/inference');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const token = process.env.HF_TOKEN;
const client = new InferenceClient(token);

console.log('🧪 Testing Public Hugging Face Models');
console.log('════════════════════════════════════════');

async function testPublicModels() {
  // Test with very basic, guaranteed-to-work models
  const publicModels = [
    'microsoft/resnet-50',
    'google/vit-base-patch16-224',
  ];
  
  // Create a proper test image (base64 encoded small image)
  const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
  const testImage = Buffer.from(testImageBase64, 'base64');
  
  for (const modelName of publicModels) {
    console.log(`\n🔍 Testing: ${modelName}`);
    
    try {
      const result = await client.imageClassification({
        data: testImage,
        model: modelName
      });
      
      console.log('✅ SUCCESS!');
      console.log('Result:', JSON.stringify(result?.slice(0, 3), null, 2));
      return modelName;
      
    } catch (error) {
      console.error('❌ Failed:', error.message);
    }
  }
  
  return null;
}

// Test if we can create a simple plant disease detection using a general model
async function testWithGeneralModel() {
  console.log('\n🌱 Testing General Image Classification for Plant Disease');
  console.log('═══════════════════════════════════════════════════════════');
  
  try {
    // Use microsoft/resnet-50 which is a general image classifier
    // We can map the results to plant-related categories
    const result = await client.imageClassification({
      data: Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=', 'base64'),
      model: 'microsoft/resnet-50'
    });
    
    console.log('✅ General model works!');
    console.log('We can use this as a fallback and interpret results for plant diseases');
    
    return true;
    
  } catch (error) {
    console.error('❌ Even general model failed:', error.message);
    return false;
  }
}

async function main() {
  const workingModel = await testPublicModels();
  
  if (!workingModel) {
    const generalWorks = await testWithGeneralModel();
    
    if (!generalWorks) {
      console.log('\n📋 DIAGNOSIS:');
      console.log('═══════════════════════════════════════');
      console.log('❌ Hugging Face API access is limited');
      console.log('🔑 Token may have restrictions or rate limits');
      console.log('💡 The current mock fallback is the best solution');
      console.log('');
      console.log('🛠️  RECOMMENDED ACTIONS:');
      console.log('1. ✅ Keep the current mock detection (already implemented)');
      console.log('2. 🔄 Try a different API (e.g., Google Vision, AWS Rekognition)');
      console.log('3. 🏠 Host your own model locally');
      console.log('4. 💰 Consider upgrading Hugging Face plan');
    }
  }
}

main().catch(console.error);