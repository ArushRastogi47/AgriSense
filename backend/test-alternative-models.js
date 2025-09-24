const dotenv = require('dotenv');
const { InferenceClient } = require('@huggingface/inference');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🧪 Testing Alternative Plant Disease Models');
console.log('═══════════════════════════════════════════');

const token = process.env.HF_TOKEN;
const client = new InferenceClient(token);

// List of alternative plant disease models to try
const models = [
  'linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification',
  'microsoft/resnet-50', // General image classification
  'google/vit-base-patch16-224', // Vision transformer
  'facebook/detr-resnet-50', // Object detection
];

// Create a small test image buffer (PNG format)
const createTestImage = () => {
  // 1x1 pixel transparent PNG
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
};

async function testModel(modelName) {
  console.log(`\n🔍 Testing model: ${modelName}`);
  console.log('─'.repeat(50));
  
  try {
    const imageBuffer = createTestImage();
    
    const result = await client.imageClassification({
      data: imageBuffer,
      model: modelName,
    });
    
    console.log('✅ Success! Result:', JSON.stringify(result?.slice(0, 3), null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    
    if (error.message.includes('accessToken')) {
      console.log('🔧 This is likely a model access issue, not authentication');
    } else if (error.message.includes('503')) {
      console.log('⏳ Model is loading, try again later');
    } else if (error.message.includes('404')) {
      console.log('📷 Model not found or not accessible');
    }
    
    return false;
  }
}

// Alternative: Try different plant disease models from Hugging Face Hub
const alternativePlantModels = [
  'umair1221/plant_disease_detection_using_CNN',
  'PlantsNet/PlantNet-300K',
  'Karnnansp/plant-disease-classifier',
  'microsoft/DinoVdiv2-base-patch16-224' // General vision model
];

async function findWorkingModel() {
  console.log('🔍 Testing primary models...');
  
  for (const model of models) {
    const success = await testModel(model);
    if (success) {
      console.log(`\n🎯 Found working model: ${model}`);
      return model;
    }
  }
  
  console.log('\n🔄 Trying alternative plant disease models...');
  
  for (const model of alternativePlantModels) {
    const success = await testModel(model);
    if (success) {
      console.log(`\n🎯 Found working alternative model: ${model}`);
      return model;
    }
  }
  
  console.log('\n❌ No working models found');
  return null;
}

async function main() {
  const workingModel = await findWorkingModel();
  
  if (workingModel) {
    console.log('\n📋 SOLUTION:');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Use this model: ${workingModel}`);
    console.log('🔧 Update plantDiseaseService.js with this model name');
  } else {
    console.log('\n📋 FALLBACK SOLUTION:');
    console.log('═══════════════════════════════════════');
    console.log('❌ No Hugging Face models are currently accessible');
    console.log('🔄 The service will use mock disease detection');
    console.log('💡 This is handled gracefully in the current code');
  }
}

main().catch(console.error);