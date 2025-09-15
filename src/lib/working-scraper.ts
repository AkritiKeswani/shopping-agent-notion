import { Stagehand } from '@browserbasehq/stagehand';
import { Deal, ScrapingResult, SearchFilters } from '@/types';

export class WorkingScraper {
  private stagehand: Stagehand | null = null;

  constructor() {
    if (!process.env.BROWSERBASE_API_KEY || !process.env.BROWSERBASE_PROJECT_ID || !process.env.OPENAI_API_KEY) {
      throw new Error('Missing required environment variables: BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID, or OPENAI_API_KEY');
    }
  }

  async scrapeAllBrands(filters: SearchFilters): Promise<ScrapingResult> {
    const deals: Deal[] = [];
    const errors: string[] = [];

    try {
      console.log('🚀 Starting working scraper...');
      
      await this.initializeStagehand();
      const page = this.stagehand!.page;

      // Scrape Aritzia
      if (!filters.brands || filters.brands.includes('aritzia')) {
        console.log('🛍️ Scraping Aritzia...');
        try {
          const aritziaDeals = await this.scrapeAritzia(page);
          deals.push(...aritziaDeals);
          console.log(`✅ Found ${aritziaDeals.length} deals from Aritzia`);
        } catch (error) {
          console.error('❌ Aritzia scraping failed:', error);
          errors.push(`Aritzia: ${error}`);
        }
      }

      // Scrape Reformation
      if (!filters.brands || filters.brands.includes('reformation')) {
        console.log('🛍️ Scraping Reformation...');
        try {
          const reformationDeals = await this.scrapeReformation(page);
          deals.push(...reformationDeals);
          console.log(`✅ Found ${reformationDeals.length} deals from Reformation`);
        } catch (error) {
          console.error('❌ Reformation scraping failed:', error);
          errors.push(`Reformation: ${error}`);
        }
      }

      return {
        deals,
        totalFound: deals.length,
        errors,
      };

    } catch (error) {
      console.error('❌ Scraping error:', error);
      return {
        deals: [],
        totalFound: 0,
        errors: [`Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    } finally {
      if (this.stagehand) {
        await this.stagehand.close();
      }
    }
  }

  private async initializeStagehand(): Promise<void> {
    this.stagehand = new Stagehand({
      env: 'BROWSERBASE',
      apiKey: process.env.BROWSERBASE_API_KEY!,
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
      modelName: 'gpt-4o',
      modelClientOptions: {
        apiKey: process.env.OPENAI_API_KEY!,
      },
    });
    
    await this.stagehand.init();
    
    // Stagehand handles viewport and user agent configuration internally
  }

  private async scrapeAritzia(page: any): Promise<Deal[]> {
    console.log('🔍 Navigating to Aritzia...');
    
    // Go to Aritzia sale page
    await page.goto('https://www.aritzia.com/us/en/sale', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check for Cloudflare challenge
    const title = await page.title();
    if (title.includes('Just a moment') || title.includes('Checking your browser')) {
      console.log('🛡️ Cloudflare challenge detected, waiting...');
      await page.waitForTimeout(20000);
      
      const newTitle = await page.title();
      if (newTitle.includes('Just a moment') || newTitle.includes('Checking your browser')) {
        console.log('🛡️ Still on challenge page, waiting longer...');
        await page.waitForTimeout(20000);
      }
    }
    
    // Wait for products to load
    await page.waitForTimeout(3000);
    
    console.log('📊 Extracting Aritzia products...');
    
    // Use Stagehand's extract to get real product data
    const result = await page.extract({
      instruction: "Extract all product items from this Aritzia sale page. For each product, get the name, price, image URL, and product URL. Look for product cards, tiles, or listings.",
      schema: {
        products: [
          {
            name: 'string',
            price: 'string',
            imageUrl: 'string',
            productUrl: 'string'
          }
        ]
      }
    });
    
    console.log(`📊 Extracted ${result.products?.length || 0} products from Aritzia`);
    
    if (result.products && result.products.length > 0) {
      return result.products.map((product: any, index: number) => {
        // Parse price - handle different formats
        const priceStr = product.price || '0';
        const priceMatch = priceStr.match(/(\d+\.?\d*)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
        
        // Estimate original price (typically 1.3-1.5x sale price)
        const originalPrice = Math.round(price * 1.4);
        
        return {
          id: `aritzia-${index + 1}-${Date.now()}`,
          title: product.name || 'Aritzia Product',
          brand: 'aritzia' as const,
          originalPrice: originalPrice,
          salePrice: price,
          size: 'M', // Default size
          clothingType: 'clothing', // Default type
          imageUrl: product.imageUrl || '',
          productUrl: product.productUrl || 'https://www.aritzia.com/us/en/sale',
          inStock: true,
          scrapedAt: new Date(),
        };
      });
    }
    
    return [];
  }

  private async scrapeReformation(page: any): Promise<Deal[]> {
    console.log('🔍 Navigating to Reformation...');
    
    // Go to Reformation sale page
    await page.goto('https://www.thereformation.com/sale', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check for Cloudflare challenge
    const title = await page.title();
    if (title.includes('Just a moment') || title.includes('Checking your browser')) {
      console.log('🛡️ Cloudflare challenge detected, waiting...');
      await page.waitForTimeout(20000);
      
      const newTitle = await page.title();
      if (newTitle.includes('Just a moment') || newTitle.includes('Checking your browser')) {
        console.log('🛡️ Still on challenge page, waiting longer...');
        await page.waitForTimeout(20000);
      }
    }
    
    // Wait for products to load
    await page.waitForTimeout(3000);
    
    console.log('📊 Extracting Reformation products...');
    
    // Use Stagehand's extract to get real product data
    const result = await page.extract({
      instruction: "Extract all product items from this Reformation sale page. For each product, get the name, price, image URL, and product URL. Look for product cards, tiles, or listings.",
      schema: {
        products: [
          {
            name: 'string',
            price: 'string',
            imageUrl: 'string',
            productUrl: 'string'
          }
        ]
      }
    });
    
    console.log(`📊 Extracted ${result.products?.length || 0} products from Reformation`);
    
    if (result.products && result.products.length > 0) {
      return result.products.map((product: any, index: number) => {
        // Parse price - handle different formats
        const priceStr = product.price || '0';
        const priceMatch = priceStr.match(/(\d+\.?\d*)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
        
        // Estimate original price (typically 1.3-1.5x sale price)
        const originalPrice = Math.round(price * 1.4);
        
        return {
          id: `reformation-${index + 1}-${Date.now()}`,
          title: product.name || 'Reformation Product',
          brand: 'reformation' as const,
          originalPrice: originalPrice,
          salePrice: price,
          size: 'M', // Default size
          clothingType: 'clothing', // Default type
          imageUrl: product.imageUrl || '',
          productUrl: product.productUrl || 'https://www.thereformation.com/sale',
          inStock: true,
          scrapedAt: new Date(),
        };
      });
    }
    
    return [];
  }
}
