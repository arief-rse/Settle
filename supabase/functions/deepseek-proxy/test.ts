// Test script for DeepSeek Proxy Edge Function

const URL = 'https://lxbkjilewkqjytkmtjds.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4YmtqaWxld2txanl0a210amRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MTEzNzMsImV4cCI6MjA1MjE4NzM3M30.8kmF2_Q3mnu6c109ZXyqe4agD652oHRrWat5dVPencA'; // Replace with your anon key

async function runTests() {
  console.log('🧪 Starting Edge Function tests...\n');

  try {
    // Test 1: Health Check
    console.log('Test 1: Health Check');
    const healthCheck = await fetch(`${URL}/functions/v1/deepseek-proxy/test`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    
    const healthResult = await healthCheck.json();
    console.log('Health Check Result:', healthResult);
    console.log('Status:', healthCheck.ok ? '✅ Passed' : '❌ Failed');
    console.log('\n-------------------\n');

    // Test 2: Basic Chat Request
    console.log('Test 2: Basic Chat Request');
    const chatResponse = await fetch(`${URL}/functions/v1/deepseek-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'X-User-ID': 'test-user'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello, this is a test message!' }],
        model: 'deepseek-chat',
        temperature: 0.7
      })
    });

    const chatResult = await chatResponse.json();
    console.log('Chat Response:', chatResult);
    console.log('Status:', chatResponse.ok ? '✅ Passed' : '❌ Failed');
    console.log('\n-------------------\n');

    // Test 3: Error Handling (Missing User ID)
    console.log('Test 3: Error Handling (Missing User ID)');
    const errorResponse = await fetch(`${URL}/functions/v1/deepseek-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'This should fail!' }]
      })
    });

    const errorResult = await errorResponse.json();
    console.log('Error Response:', errorResult);
    console.log('Status:', errorResponse.status === 401 ? '✅ Passed' : '❌ Failed');
    console.log('\n-------------------\n');

    // Test 4: Invalid Request Body
    console.log('Test 4: Invalid Request Body');
    const invalidResponse = await fetch(`${URL}/functions/v1/deepseek-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'X-User-ID': 'test-user'
      },
      body: JSON.stringify({
        invalid: 'data'
      })
    });

    const invalidResult = await invalidResponse.json();
    console.log('Invalid Request Response:', invalidResult);
    console.log('Status:', invalidResponse.status === 400 ? '✅ Passed' : '❌ Failed');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the tests
runTests().then(() => {
  console.log('\n🏁 All tests completed!');
}); 