#!/usr/bin/env node

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

async function testBackend() {
    console.log('🧪 Testing AgriSense Backend API...\n');
    
    try {
        // Test health endpoint
        console.log('1️⃣ Testing health endpoint...');
        const health = await axios.get(`${BACKEND_URL}/api/health`);
        console.log('✅ Health check:', health.data);
        
        // Test AI service
        console.log('\n2️⃣ Testing AI service...');
        const aiTest = await axios.get(`${BACKEND_URL}/api/query/test-ai`);
        console.log('🤖 AI test result:', aiTest.data);
        
        // Test query creation
        console.log('\n3️⃣ Testing query creation...');
        const queryResponse = await axios.post(`${BACKEND_URL}/api/query`, {
            text: 'What is the best time to plant tomatoes?',
            roomId: 'test-room-123'
        });
        console.log('📝 Query created:', queryResponse.data);
        
        // Test query response retrieval
        if (queryResponse.data.id) {
            console.log('\n4️⃣ Testing response retrieval...');
            
            // Wait a bit for AI response generation
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const responseData = await axios.get(`${BACKEND_URL}/api/query/response/${queryResponse.data.id}`);
            console.log('📤 Response retrieved:', responseData.data);
        }
        
        console.log('\n✅ All API tests passed! Backend is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testBackend();
