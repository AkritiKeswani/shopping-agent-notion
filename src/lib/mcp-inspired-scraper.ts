import { Stagehand } from '@browserbasehq/stagehand';
import { Deal, ScrapingResult, SearchFilters } from '@/types';

export class MCPInspiredScraper {
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
      console.log('🚀 Starting MCP-inspired scraping...');
      console.log('📋 Filters:', filters);

      // Initialize Stagehand with retry logic
      console.log('🔧 Initializing Stagehand...');
      await this.initializeWithRetry();
      const page = this.stagehand!.page;
      console.log('✅ Stagehand initialized successfully!');

      // Scrape each brand using MCP approach
      if (!filters.brands || filters.brands.includes('aritzia')) {
        console.log('🛍️ Scraping Aritzia using MCP approach...');
        try {
          const aritziaDeals = await this.scrapeAritziaMCP(page, filters);
          deals.push(...aritziaDeals);
          console.log(`✅ Found ${aritziaDeals.length} deals from Aritzia`);
        } catch (error) {
          console.error('❌ Aritzia scraping failed:', error);
          errors.push(`Aritzia: ${error}`);
        }
      }

      if (!filters.brands || filters.brands.includes('reformation')) {
        console.log('🛍️ Scraping Reformation using MCP approach...');
        try {
          const reformationDeals = await this.scrapeReformationMCP(page, filters);
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
      console.error('❌ MCP-inspired scraping error:', error);
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
        // Create Stagehand instance if it doesn't exist
        if (!this.stagehand) {
          this.stagehand = new Stagehand({
            env: 'BROWSERBASE',
            apiKey: process.env.BROWSERBASE_API_KEY!,
            projectId: process.env.BROWSERBASE_PROJECT_ID!,
            modelName: 'gpt-4o',
            modelClientOptions: {
              apiKey: process.env.OPENAI_API_KEY!,
            },
          });
        }
        
        await this.stagehand.init();
        
        // Configure stealth settings immediately after initialization
        const page = this.stagehand.page;
        await this.configureStealthSettings(page);
        
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

  private async configureStealthSettings(page: any): Promise<void> {
    console.log('🔧 Configuring stealth settings...');
    
    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✅ Stealth settings configured');
  }

  private async scrapeAritziaMCP(page: any, filters: SearchFilters): Promise<Deal[]> {
    console.log('🔍 Starting Aritzia scraping with MCP approach...');
    
    try {
      // Step 1: Start with homepage (natural entry)
      console.log('🏠 Navigating to Aritzia homepage...');
      await page.goto('https://www.aritzia.com', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Wait for network to be idle (like MCP version)
      await page.waitForLoadState('networkidle');
      
      // Step 2: Navigate to search with sale-related terms
      console.log('🔍 Searching for sale items...');
      const searchQuery = filters.clothingType ? `sale ${filters.clothingType}` : 'sale';
      const searchUrl = `https://www.aritzia.com/us/en/search?q=${encodeURIComponent(searchQuery)}`;
      
      await page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Wait for network to be idle (crucial for challenge resolution)
      await page.waitForLoadState('networkidle');
      
      // Check for challenges
      const title = await page.title();
      if (title.includes('Just a moment') || title.includes('Checking your browser')) {
        console.log('🛡️ Cloudflare challenge detected, waiting...');
        await page.waitForTimeout(15000); // Wait longer for challenge
        
        // Check again
        const newTitle = await page.title();
        if (newTitle.includes('Just a moment') || newTitle.includes('Checking your browser')) {
          console.log('🛡️ Still on challenge page, waiting longer...');
          await page.waitForTimeout(15000);
        }
      }
      
      // Step 3: Try to apply sorting (like MCP version)
      console.log('📊 Applying sorting...');
      try {
        const sortActions = await page.observe("open the sort dropdown");
        if (sortActions && sortActions.length > 0) {
          await page.act(sortActions[0]);
          
          // Try to select "Best Sellers" or "Top Rated"
          try {
            await page.act("choose Best Sellers");
            console.log('✅ Applied Best Sellers sorting');
          } catch {
            try {
              await page.act("choose Top Rated");
              console.log('✅ Applied Top Rated sorting');
            } catch {
              console.log('⚠️ Could not apply sorting, using default results');
            }
          }
        }
      } catch (e) {
        console.log('⚠️ Could not find sort dropdown for Aritzia');
      }
      
      // Wait for results to load
      await page.waitForTimeout(3000);
      
      // Step 4: Extract products (like MCP version)
      console.log('📊 Extracting Aritzia products...');
      
      const result = await page.extract({
        instruction: "Extract product cards with name, price, url, and image from the search results. Focus on sale items and items that match the search criteria.",
        schema: {
          items: [
            {
              name: 'string',
              price: 'string',
              url: 'string',
              imageUrl: 'string'
            }
          ]
        }
      });
      
      console.log(`📊 Extracted ${result.items?.length || 0} products from Aritzia`);
      
      if (result.items && result.items.length > 0) {
        return result.items.map((item: any, index: number) => {
          // Parse price (handle both string and number)
          const priceStr = typeof item.price === 'string' ? item.price : String(item.price);
          const priceMatch = priceStr.match(/(\d+\.?\d*)/);
          const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
          
          // Estimate original price (typically 1.3-1.5x sale price for sale items)
          const originalPrice = Math.round(price * 1.4);
          
          return {
            id: `aritzia-${index + 1}-${Date.now()}`,
            title: item.name || 'Aritzia Product',
            brand: 'aritzia' as const,
            originalPrice: originalPrice,
            salePrice: price,
            size: filters.size || 'M',
            clothingType: filters.clothingType || 'clothing',
            imageUrl: item.imageUrl || '',
            productUrl: item.url || 'https://www.aritzia.com/us/en/search',
            inStock: true,
            scrapedAt: new Date(),
          };
        });
      }
      
      console.log('📊 No products found on Aritzia search results');
      return [];
      
    } catch (error) {
      console.error('Aritzia MCP scraping error:', error);
      throw error;
    }
  }

  private async scrapeReformationMCP(page: any, filters: SearchFilters): Promise<Deal[]> {
    console.log('🔍 Starting Reformation scraping with MCP approach...');
    
    try {
      // Step 1: Start with homepage
      console.log('🏠 Navigating to Reformation homepage...');
      await page.goto('https://www.thereformation.com', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      await page.waitForLoadState('networkidle');
      
      // Step 2: Navigate to search with sale terms
      console.log('🔍 Searching for sale items...');
      const searchQuery = filters.clothingType ? `sale ${filters.clothingType}` : 'sale';
      const searchUrl = `https://www.thereformation.com/search?q=${encodeURIComponent(searchQuery)}`;
      
      await page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      await page.waitForLoadState('networkidle');
      
      // Check for challenges
      const title = await page.title();
      if (title.includes('Just a moment') || title.includes('Checking your browser')) {
        console.log('🛡️ Cloudflare challenge detected, waiting...');
        await page.waitForTimeout(15000);
        
        const newTitle = await page.title();
        if (newTitle.includes('Just a moment') || newTitle.includes('Checking your browser')) {
          console.log('🛡️ Still on challenge page, waiting longer...');
          await page.waitForTimeout(15000);
        }
      }
      
      // Wait for results
      await page.waitForTimeout(3000);
      
      // Extract products
      console.log('📊 Extracting Reformation products...');
      
      const result = await page.extract({
        instruction: "Extract product cards with name, price, url, and image from the search results. Focus on sale items.",
        schema: {
          items: [
            {
              name: 'string',
              price: 'string',
              url: 'string',
              imageUrl: 'string'
            }
          ]
        }
      });
      
      console.log(`📊 Extracted ${result.items?.length || 0} products from Reformation`);
      
      if (result.items && result.items.length > 0) {
        return result.items.map((item: any, index: number) => {
          const priceStr = typeof item.price === 'string' ? item.price : String(item.price);
          const priceMatch = priceStr.match(/(\d+\.?\d*)/);
          const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
          const originalPrice = Math.round(price * 1.4);
          
          return {
            id: `reformation-${index + 1}-${Date.now()}`,
            title: item.name || 'Reformation Product',
            brand: 'reformation' as const,
            originalPrice: originalPrice,
            salePrice: price,
            size: filters.size || 'M',
            clothingType: filters.clothingType || 'clothing',
            imageUrl: item.imageUrl || '',
            productUrl: item.url || 'https://www.thereformation.com/search',
            inStock: true,
            scrapedAt: new Date(),
          };
        });
      }
      
      console.log('📊 No products found on Reformation search results');
      return [];
      
    } catch (error) {
      console.error('Reformation MCP scraping error:', error);
      throw error;
    }
  }
}
