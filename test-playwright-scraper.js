require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');
const { Browserbase } = require('@browserbasehq/sdk');

async function testScraper() {
  console.log('🚀 Testing Playwright scraper...');
  
  const browserbase = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY,
  });

  try {
    // Create Browserbase session
    const session = await browserbase.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      keepAlive: true,
    });

    console.log(`📱 Created Browserbase session: ${session.id}`);

    // Connect Playwright to Browserbase
    const browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0] || await browser.newContext();
    const page = context.pages()[0] || await context.newPage();

    // Test Aritzia
    console.log('🛍️ Testing Aritzia...');
    await page.goto('https://www.aritzia.com/us/en/sale', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForTimeout(5000);
    
    // Check for Cloudflare challenge
    const title = await page.title();
    console.log('Page title:', title);
    
    if (title.includes('Just a moment') || title.includes('Checking your browser')) {
      console.log('🛡️ Cloudflare challenge detected, waiting...');
      await page.waitForTimeout(40000);
      
      // Check title again
      const newTitle = await page.title();
      console.log('New page title after wait:', newTitle);
    }
    
    // Wait for products to load
    await page.waitForTimeout(3000);
    
    // Extract products using Playwright selectors
    const products = await page.evaluate(() => {
      // Try multiple selectors to find products
      const selectors = [
        '[data-testid="product-tile"]',
        '.product-tile',
        '.product-item', 
        '.product-card',
        '.product',
        '[data-testid="product-card"]',
        '.product-tile-wrapper',
        '.product-wrapper',
        'article',
        '.grid-item',
        '.product-grid-item'
      ];
      
      let productElements = [];
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`Selector "${selector}" found ${elements.length} elements`);
        if (elements.length > 0) {
          productElements = elements;
          break;
        }
      }
      
      console.log('Total product elements found:', productElements.length);
      
      const results = [];
      
      for (let i = 0; i < Math.min(productElements.length, 5); i++) {
        const element = productElements[i];
        
        // Try multiple selectors for product name
        const nameSelectors = [
          '[data-testid="product-name"]',
          '.product-name',
          '.product-title',
          'h3',
          'h4',
          '.name',
          'a[href*="/product/"]',
          '.product-link'
        ];
        
        let name = '';
        for (const selector of nameSelectors) {
          const nameEl = element.querySelector(selector);
          if (nameEl && nameEl.textContent?.trim()) {
            name = nameEl.textContent.trim();
            break;
          }
        }
        
        // Try multiple selectors for price
        const priceSelectors = [
          '[data-testid="price"]',
          '.price',
          '.product-price',
          '.sale-price',
          '.original-price',
          '[class*="price"]',
          '.money'
        ];
        
        let price = '';
        for (const selector of priceSelectors) {
          const priceEl = element.querySelector(selector);
          if (priceEl && priceEl.textContent?.trim()) {
            price = priceEl.textContent.trim();
            break;
          }
        }
        
        if (name && price) {
          results.push({
            name: name,
            price: price
          });
        }
      }
      
      return results;
    });
    
    console.log(`📊 Extracted ${products.length} products from Aritzia:`, products);

    await browser.close();
    // Note: sessions.end might not be available in this SDK version
    console.log('✅ Test completed');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testScraper();
