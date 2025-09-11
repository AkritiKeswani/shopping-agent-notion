const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config({ path: '.env.local' });

async function testBrowserbaseAPI() {
  console.log('🧪 Testing Browserbase API...');
  
  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;
  
  console.log('API Key:', apiKey ? 'Present' : 'Missing');
  console.log('Project ID:', projectId ? 'Present' : 'Missing');
  
  try {
    // Test creating a session
    const response = await fetch('https://api.browserbase.com/v1/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: projectId,
        keepAlive: false,
        timeout: 300000,
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Session created successfully:', data);
      
      // Close the session
      await fetch(`https://api.browserbase.com/v1/sessions/${data.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      console.log('🔒 Session closed');
    } else {
      const error = await response.text();
      console.error('❌ Failed to create session:', error);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

testBrowserbaseAPI();
