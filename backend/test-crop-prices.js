const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing Crop Prices API...');
    const response = await axios.get('http://localhost:3001/api/crop-prices?state=kerala&limit=3');
    console.log('✅ Success! Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAPI();