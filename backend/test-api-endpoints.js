const axios = require('axios');

// Test the Krishi Seva Kendra API
async function testKrishiSevaKendraAPI() {
  try {
    console.log('Testing Krishi Seva Kendra API...');
    const response = await axios.get('http://localhost:3001/api/krishi-seva-kendra?latitude=10.0261&longitude=76.3105&state=kerala');
    console.log('✅ Krishi Seva Kendra API Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Krishi Seva Kendra API Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Test the Crop Prices API
async function testCropPricesAPI() {
  try {
    console.log('\nTesting Crop Prices API...');
    const response = await axios.get('http://localhost:3001/api/crop-prices?state=kerala&limit=5');
    console.log('✅ Crop Prices API Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Crop Prices API Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Test server health
async function testServerHealth() {
  try {
    console.log('\nTesting Server Health...');
    const response = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Server Health Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Server Health Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
  }
}

// Run all tests
async function runTests() {
  await testServerHealth();
  await testKrishiSevaKendraAPI();
  await testCropPricesAPI();
}

runTests();