const axios = require('axios');

async function testKrishiAPI() {
  try {
    console.log('Testing Krishi Seva Kendra API...');
    const response = await axios.get('http://localhost:3001/api/krishi-seva-kendra?latitude=10.0261&longitude=76.3105&state=kerala');
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

testKrishiAPI();