import { Stagehand } from '@browserbasehq/stagehand';
import { Deal, ScrapingResult, SearchFilters } from '@/types';

export class StagehandAdvancedScraper {
  private stagehand: Stagehand | null = null;

  constructor() {
    // Check for required environment variables
    if (!process.env.BROWSERBASE_API_KEY || !process.env.BROWSERBASE_PROJECT_ID || !process.env.OPENAI_API_KEY) {
      throw new Error('Missing required environment variables: BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID, or OPENAI_API_KEY');
    }
  }

  async scrapeAllBrands(filters: SearchFilters): Promise<ScrapingResult> {
    const deals: Deal[] = [];
    const errors: string[] = [];

    try {
      console.log('🚀 Starting Stagehand Advanced Scraper...');
      console.log('📋 Filters:', filters);

      // Initialize Stagehand with retry logic
      console.log('🔧 Initializing Stagehand...');
      await this.initializeWithRetry();
      const page = this.stagehand!.page;
      console.log('✅ Stagehand initialized successfully!');

      // Scrape each brand using advanced Stagehand methods
      if (!filters.brands || filters.brands.includes('aritzia')) {
        console.log('🛍️ Scraping Aritzia with advanced Stagehand methods...');
        try {
          const aritziaDeals = await this.scrapeAritziaAdvanced(page, filters);
          deals.push(...aritziaDeals);
          console.log(`✅ Found ${aritziaDeals.length} deals from Aritzia`);
        } catch (error) {
          console.error('❌ Aritzia scraping failed:', error);
          errors.push(`Aritzia: ${error}`);
        }
      }

      if (!filters.brands || filters.brands.includes('reformation')) {
        console.log('🛍️ Scraping Reformation with advanced Stagehand methods...');
        try {
          const reformationDeals = await this.scrapeReformationAdvanced(page, filters);
          deals.push(...reformationDeals);
          console.log(`✅ Found ${reformationDeals.length} deals from Reformation`);
        } catch (error) {
          console.error('❌ Reformation scraping failed:', error);
          errors.push(`Reformation: ${error}`);
        }
      }

      console.log(`🎉 Total deals found: ${deals.length}`);

      return {
        deals,
        totalFound: deals.length,
        errors,
      };

    } catch (error) {
      console.error('❌ Advanced scraping error:', error);
      return {
        deals: [],
        totalFound: 0,
        errors: [`Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    } finally {
      if (this.stagehand) {
        console.log('🔒 Closing Stagehand session...');
        try {
          await this.stagehand.close();
          console.log('✅ Stagehand session closed');
        } catch (closeError) {
          console.error('❌ Error closing session:', closeError);
        }
      }
    }
  }

  private async initializeWithRetry(maxRetries: number = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Create Stagehand instance with advanced configuration
        if (!this.stagehand) {
          this.stagehand = new Stagehand({
            env: 'BROWSERBASE',
            apiKey: process.env.BROWSERBASE_API_KEY!,
            projectId: process.env.BROWSERBASE_PROJECT_ID!,
            modelName: 'gpt-4o', // Use GPT-4o for better performance
            modelClientOptions: {
              apiKey: process.env.OPENAI_API_KEY!,
            },
            // Advanced configuration for better stealth
            experimental: true, // Enable shadow DOM support
            verbose: 1, // Enable logging for debugging
          });
        }
        
        await this.stagehand.init();
        
        // Configure advanced stealth settings
        const page = this.stagehand.page;
        await this.configureAdvancedStealth(page);
        
        return;
      } catch (error: any) {
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          const waitTime = attempt * 30;
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        } else if (attempt === maxRetries) {
          throw error;
        } else {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
  }

  private async configureAdvancedStealth(page: any): Promise<void> {
    console.log('🔧 Configuring advanced stealth settings...');
    
    // Set realistic viewport (1920x1080 is optimal for Computer Use Agents)
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set timezone and locale
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', { value: 'en-US' });
      Object.defineProperty(navigator, 'languages', { value: ['en-US', 'en'] });
      Object.defineProperty(navigator, 'platform', { value: 'MacIntel' });
    });
    
    console.log('✅ Advanced stealth settings configured');
  }

  private async scrapeAritziaAdvanced(page: any, filters: SearchFilters): Promise<Deal[]> {
    console.log('🔍 Starting advanced Aritzia scraping...');
    
    try {
      // Step 1: Navigate to homepage (natural entry)
      console.log('🏠 Navigating to Aritzia homepage...');
      await page.goto('https://www.aritzia.com', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Wait for network to be idle (crucial for challenge resolution)
      await page.waitForLoadState('networkidle');
      
      // Step 2: Use observe to find sale navigation
      console.log('🔍 Looking for sale navigation...');
      const saleActions = await page.observe("Find the sale or clearance navigation link");
      
      if (saleActions && saleActions.length > 0) {
        console.log('✅ Found sale navigation, clicking...');
        await page.act(saleActions[0]); // Use observed action directly
        await page.waitForLoadState('networkidle');
      } else {
        // Fallback to direct URL
        console.log('⚠️ Sale navigation not found, going directly to sale page...');
        await page.goto('https://www.aritzia.com/us/en/sale', { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        await page.waitForLoadState('networkidle');
      }
      
      // Step 3: Check for and handle challenges
      await this.handleChallenges(page, 'aritzia');
      
      // Step 4: Use observe to find search functionality
      console.log('🔍 Looking for search functionality...');
      const searchActions = await page.observe("Find the search box or search input field");
      
      if (searchActions && searchActions.length > 0) {
        console.log('✅ Found search box, searching for items...');
        const searchQuery = filters.clothingType || 'sale';
        await page.act({
          action: "Type %query% in the search box and press enter",
          variables: {
            query: searchQuery
          }
        });
        await page.waitForLoadState('networkidle');
      }
      
      // Step 5: Try to apply sorting using observe
      console.log('📊 Looking for sorting options...');
      const sortActions = await page.observe("Find the sort dropdown or sorting options");
      
      if (sortActions && sortActions.length > 0) {
        console.log('✅ Found sorting options, applying best sellers...');
        await page.act(sortActions[0]); // Click sort dropdown
        
        // Look for best sellers option
        const bestSellersActions = await page.observe("Find the best sellers or top rated option");
        if (bestSellersActions && bestSellersActions.length > 0) {
          await page.act(bestSellersActions[0]);
          console.log('✅ Applied best sellers sorting');
        }
      }
      
      // Step 6: Wait for results to load
      await page.waitForTimeout(3000);
      
      // Step 7: Use observe to find product containers
      console.log('📊 Looking for product containers...');
      const productContainers = await page.observe("Find product cards or product containers");
      
      if (productContainers && productContainers.length > 0) {
        console.log(`✅ Found ${productContainers.length} product containers`);
        
        // Use extract with observed selector for better accuracy
        const result = await page.extract({
          instruction: "Extract product information from the product cards including name, price, image URL, and product URL",
          schema: {
            products: [
              {
                name: 'string',
                price: 'string',
                imageUrl: 'string',
                productUrl: 'string',
                inStock: 'boolean'
              }
            ]
          },
          selector: productContainers[0].selector // Use observed selector to reduce context
        });
        
        console.log(`📊 Extracted ${result.products?.length || 0} products from Aritzia`);
        
        if (result.products && result.products.length > 0) {
          return result.products.map((product: any, index: number) => {
            // Parse price
            const priceStr = typeof product.price === 'string' ? product.price : String(product.price);
            const priceMatch = priceStr.match(/(\d+\.?\d*)/);
            const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
            const originalPrice = Math.round(price * 1.4); // Estimate original price
            
            return {
              id: `aritzia-${index + 1}-${Date.now()}`,
              title: product.name || 'Aritzia Product',
              brand: 'aritzia' as const,
              originalPrice: originalPrice,
              salePrice: price,
              size: filters.size || 'M',
              clothingType: filters.clothingType || 'clothing',
              imageUrl: product.imageUrl || '',
              productUrl: product.productUrl || 'https://www.aritzia.com/us/en/sale',
              inStock: product.inStock !== undefined ? product.inStock : true,
              scrapedAt: new Date(),
            };
          });
        }
      }
      
      console.log('📊 No products found on Aritzia page');
      return [];
      
    } catch (error) {
      console.error('Aritzia advanced scraping error:', error);
      throw error;
    }
  }

  private async scrapeReformationAdvanced(page: any, filters: SearchFilters): Promise<Deal[]> {
    console.log('🔍 Starting advanced Reformation scraping...');
    
    try {
      // Step 1: Navigate to homepage
      console.log('🏠 Navigating to Reformation homepage...');
      await page.goto('https://www.thereformation.com', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      await page.waitForLoadState('networkidle');
      
      // Step 2: Use observe to find sale navigation
      console.log('🔍 Looking for sale navigation...');
      const saleActions = await page.observe("Find the sale or clearance navigation link");
      
      if (saleActions && saleActions.length > 0) {
        console.log('✅ Found sale navigation, clicking...');
        await page.act(saleActions[0]);
        await page.waitForLoadState('networkidle');
      } else {
        // Fallback to direct URL
        console.log('⚠️ Sale navigation not found, going directly to sale page...');
        await page.goto('https://www.thereformation.com/sale', { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        await page.waitForLoadState('networkidle');
      }
      
      // Step 3: Check for and handle challenges
      await this.handleChallenges(page, 'reformation');
      
      // Step 4: Wait for results to load
      await page.waitForTimeout(3000);
      
      // Step 5: Use observe to find product containers
      console.log('📊 Looking for product containers...');
      const productContainers = await page.observe("Find product cards or product containers");
      
      if (productContainers && productContainers.length > 0) {
        console.log(`✅ Found ${productContainers.length} product containers`);
        
        // Use extract with observed selector
        const result = await page.extract({
          instruction: "Extract product information from the product cards including name, price, image URL, and product URL",
          schema: {
            products: [
              {
                name: 'string',
                price: 'string',
                imageUrl: 'string',
                productUrl: 'string',
                inStock: 'boolean'
              }
            ]
          },
          selector: productContainers[0].selector
        });
        
        console.log(`📊 Extracted ${result.products?.length || 0} products from Reformation`);
        
        if (result.products && result.products.length > 0) {
          return result.products.map((product: any, index: number) => {
            const priceStr = typeof product.price === 'string' ? product.price : String(product.price);
            const priceMatch = priceStr.match(/(\d+\.?\d*)/);
            const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
            const originalPrice = Math.round(price * 1.4);
            
            return {
              id: `reformation-${index + 1}-${Date.now()}`,
              title: product.name || 'Reformation Product',
              brand: 'reformation' as const,
              originalPrice: originalPrice,
              salePrice: price,
              size: filters.size || 'M',
              clothingType: filters.clothingType || 'clothing',
              imageUrl: product.imageUrl || '',
              productUrl: product.productUrl || 'https://www.thereformation.com/sale',
              inStock: product.inStock !== undefined ? product.inStock : true,
              scrapedAt: new Date(),
            };
          });
        }
      }
      
      console.log('📊 No products found on Reformation page');
      return [];
      
    } catch (error) {
      console.error('Reformation advanced scraping error:', error);
      throw error;
    }
  }

  private async handleChallenges(page: any, site: string): Promise<void> {
    console.log('🔍 Checking for Cloudflare challenges...');
    
    // Check for various challenge indicators using observe
    const challengeIndicators = await page.observe("Find Cloudflare challenge, Turnstile, or 'Just a moment' elements");
    
    if (challengeIndicators && challengeIndicators.length > 0) {
      console.log('🛡️ Cloudflare challenge detected!');
      console.log('👤 Please solve the challenge in the Browserbase session...');
      
      // Notify human and wait for challenge completion
      try {
        await this.stagehand!.notify("Cloudflare challenge detected. Please solve in the live session.");
        
        // Wait for challenge completion
        await page.waitForFunction(() => {
          return document.cookie.includes('cf_clearance') || 
                 !document.title.includes('Just a moment') ||
                 !document.title.includes('Checking your browser');
        }, { timeout: 180000 }); // 3 minutes timeout
        
        console.log('✅ Challenge appears to be solved!');
      } catch (error) {
        console.log('❌ Challenge resolution timeout or failed');
        throw new Error('Failed to resolve Cloudflare challenge');
      }
    } else {
      // Also check page title and content
      const title = await page.title();
      const bodyText = await page.textContent('body').catch(() => '');
      
      if (title.includes('Just a moment') || 
          title.includes('Checking your browser') ||
          title.includes('Please wait') ||
          bodyText.includes('cf-challenge') ||
          bodyText.includes('Cloudflare')) {
        
        console.log('🛡️ Challenge detected in page content');
        console.log('👤 Please solve the challenge in the Browserbase session...');
        
        try {
          await this.stagehand!.notify("Cloudflare challenge detected. Please solve in the live session.");
          
          await page.waitForFunction(() => {
            return document.cookie.includes('cf_clearance') || 
                   !document.title.includes('Just a moment') ||
                   !document.title.includes('Checking your browser');
          }, { timeout: 180000 });
          
          console.log('✅ Challenge appears to be solved!');
        } catch (error) {
          console.log('❌ Challenge resolution timeout or failed');
          throw new Error('Failed to resolve Cloudflare challenge');
        }
      } else {
        console.log('✅ No challenges detected, proceeding normally...');
      }
    }
  }
}
