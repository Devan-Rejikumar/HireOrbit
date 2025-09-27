// Simple test script to verify API Gateway
const axios = require('axios');

const GATEWAY_URL = 'http://localhost:4000';

async function testGateway() {
  console.log('🧪 Testing API Gateway...\n');

  try {
    // Test health check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${GATEWAY_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test metrics
    console.log('2. Testing Metrics...');
    const metricsResponse = await axios.get(`${GATEWAY_URL}/metrics`);
    console.log('✅ Metrics:', metricsResponse.data);
    console.log('');

    // Test public route (should work without auth)
    console.log('3. Testing Public Route (Login)...');
    try {
      const loginResponse = await axios.post(`${GATEWAY_URL}/api/users/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      console.log('✅ Login Response:', loginResponse.data);
    } catch (error) {
      console.log('⚠️  Login failed (expected if user service not running):', error.response?.data || error.message);
    }
    console.log('');

    // Test protected route (should fail without auth)
    console.log('4. Testing Protected Route (without auth)...');
    try {
      const protectedResponse = await axios.get(`${GATEWAY_URL}/api/users/profile`);
      console.log('❌ This should have failed:', protectedResponse.data);
    } catch (error) {
      console.log('✅ Protected route correctly rejected:', error.response?.data || error.message);
    }
    console.log('');

    console.log('🎉 API Gateway test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testGateway();
