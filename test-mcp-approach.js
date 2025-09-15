const { chromium } = require('playwright');
const { Browserbase } = require('@browserbasehq/sdk');
require('dotenv').config({ path: '.env.local' });

async function testMCPApproach() {
  console.log('🧪 Testing MCP Approach (Direct Browserbase)...');
  
  let browser = null;
  
  try {
    // Create Browserbase session
    const browserbase = new Browserbase({
      apiKey: process.env.BROWSERBASE_API_KEY,
    });
    
    console.log('🔧 Creating Browserbase session...');
    const session = await browserbase.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      keepAlive: true,
      userMetadata: { test: 'mcp-approach', runId: Date.now().toString() }
    });
    
    console.log('✅ Session created:', session.id);
    
    // Connect via CDP
    browser = await chromium.connectOverCDP(session.connectUrl);
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🌐 Testing Aritzia...');
    await page.goto('https://www.aritzia.com/us/en/sale', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait for Cloudflare challenge
    let title = await page.title();
    console.log('📄 Initial title:', title);
    
    if (title.includes('Just a moment') || title.includes('Checking your browser')) {
      console.log('🛡️ Cloudflare challenge detected, waiting...');
      await page.waitForTimeout(20000);
      
      title = await page.title();
      console.log('📄 Title after wait:', title);
    }
    
    if (title.includes('Sale') || title.includes('Aritzia')) {
      console.log('✅ Successfully bypassed Cloudflare!');
      
      // Wait for products to load - try multiple approaches
      console.log('⏳ Waiting for products to load...');
      
      // Wait for network to be idle
      await page.waitForLoadState('networkidle');
      
      // Wait a bit more for dynamic content
      await page.waitForTimeout(5000);
      
      // Scroll to trigger lazy loading
      await page.evaluate(() => {
        window.scrollTo(0, 500);
      });
      await page.waitForTimeout(2000);
      
      await page.evaluate(() => {
        window.scrollTo(0, 1000);
      });
      await page.waitForTimeout(2000);
      
      // Try to extract products using simple selectors
      const products = await page.evaluate(() => {
        const results = [];
        
        // Look for any elements that might contain product info
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach((element, index) => {
          if (index > 100) return; // Limit search
          
          const text = element.textContent?.trim();
          if (text && text.includes('$') && text.length < 50) {
            // Look for parent element that might be a product
            let parent = element.parentElement;
            while (parent && parent !== document.body) {
              const parentText = parent.textContent?.trim();
              if (parentText && parentText.length > 10 && parentText.length < 200) {
                results.push({
                  text: parentText,
                  hasPrice: text.includes('$'),
                  element: parent.tagName
                });
                break;
              }
              parent = parent.parentElement;
            }
          }
        });
        
        return results.slice(0, 5); // Return first 5
      });
      
      console.log(`📊 Found ${products.length} potential products:`);
      products.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.text.substring(0, 100)}...`);
      });
      
    } else {
      console.log('❌ Still blocked or on challenge page');
    }
    
    console.log('✅ MCP approach test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('❌ Error details:', error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed!');
    }
  }
}

testMCPApproach();
