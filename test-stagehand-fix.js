const { Stagehand } = require('@browserbasehq/stagehand');
require('dotenv').config({ path: '.env.local' });

async function testStagehandFix() {
  console.log('🧪 Testing Stagehand Fix...');
  
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
    
    console.log('✅ Stagehand initialized!');
    
    const page = stagehand.page;
    
    console.log('🌐 Testing with Google first...');
    await page.goto('https://www.google.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log('📊 Testing simple extract...');
    
    // Test with a simple extract first
    const result = await page.extract({
      instruction: 'What is the title of this page?',
      schema: {
        title: 'string'
      }
    });
    
    console.log('✅ Simple extract worked:', result);
    
    await stagehand.close();
    console.log('🔒 Session closed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('❌ Error details:', error.message);
  }
}

testStagehandFix();
