const { Stagehand } = require('@browserbasehq/stagehand');

async function testBrowserbase() {
  console.log('🧪 Testing Browserbase connection...');
  
  try {
    const stagehand = new Stagehand({
      env: 'BROWSERBASE',
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      modelName: 'gpt-4o',
      modelClientOptions: {
        apiKey: process.env.OPENAI_API_KEY,
      },
    });

    console.log('🔧 Initializing Stagehand...');
    await stagehand.init();
    
    console.log('✅ Stagehand initialized successfully!');
    
    const page = stagehand.page;
    console.log('🌐 Navigating to Google...');
    await page.goto('https://www.google.com');
    
    console.log('✅ Successfully navigated to Google!');
    
    await stagehand.close();
    console.log('🔒 Session closed successfully!');
    
  } catch (error) {
    console.error('❌ Browserbase test failed:', error);
  }
}

testBrowserbase();
