import { z } from 'zod';
import { Stagehand } from '@browserbasehq/stagehand';
import { Deal, ScrapingResult, SearchFilters } from '@/types';

const ProductSchema = z.object({
  title: z.string(),
  brand: z.string(),
  originalPrice: z.number(),
  salePrice: z.number(),
  size: z.string(),
  clothingType: z.string(),
  imageUrl: z.string(),
  productUrl: z.string(),
  inStock: z.boolean(),
});

export class RealScraper {
  private stagehand: Stagehand | null = null;

  constructor() {
    // Don't initialize here - do it in scrapeAllBrands
  }

  async scrapeAllBrands(filters: SearchFilters): Promise<ScrapingResult> {
    const deals: Deal[] = [];
    const errors: string[] = [];

    try {
      console.log('🚀 Starting REAL web scraping with Browserbase...');
      
      // Initialize Stagehand with Browserbase session
      this.stagehand = new Stagehand({
        env: 'BROWSERBASE',
        apiKey: process.env.BROWSERBASE_API_KEY!,
        projectId: process.env.BROWSERBASE_PROJECT_ID!,
        modelName: 'gpt-4o',
        modelClientOptions: {
          apiKey: process.env.OPENAI_API_KEY!,
        },
      });

      console.log('🔧 Initializing Browserbase session...');
      await this.stagehand.init();
      const page = this.stagehand.page;
      
      console.log('✅ Browserbase session initialized successfully!');

      // Scrape Aritzia
      if (!filters.brands || filters.brands.includes('aritzia')) {
        console.log('🛍️ Scraping Aritzia...');
        try {
          const aritziaDeals = await this.scrapeAritzia(page, filters);
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
          const reformationDeals = await this.scrapeReformation(page, filters);
          deals.push(...reformationDeals);
          console.log(`✅ Found ${reformationDeals.length} deals from Reformation`);
        } catch (error) {
          console.error('❌ Reformation scraping failed:', error);
          errors.push(`Reformation: ${error}`);
        }
      }

      // Scrape Free People
      if (!filters.brands || filters.brands.includes('free-people')) {
        console.log('🛍️ Scraping Free People...');
        try {
          const freePeopleDeals = await this.scrapeFreePeople(page, filters);
          deals.push(...freePeopleDeals);
          console.log(`✅ Found ${freePeopleDeals.length} deals from Free People`);
        } catch (error) {
          console.error('❌ Free People scraping failed:', error);
          errors.push(`Free People: ${error}`);
        }
      }

      console.log(`🎉 Total deals found: ${deals.length}`);

      return {
        deals,
        totalFound: deals.length,
        errors,
      };

    } catch (error) {
      console.error('Real scraping error:', error);
      return {
        deals: [],
        totalFound: 0,
        errors: [`Scraping failed: ${error}`],
      };
    } finally {
      if (this.stagehand) {
        console.log('🔒 Closing Browserbase session...');
        await this.stagehand.close();
        console.log('✅ Browserbase session closed');
      }
    }
  }

  private async scrapeAritzia(page: any, filters: SearchFilters): Promise<Deal[]> {
    console.log('🔍 Navigating to Aritzia sale page...');
    await page.goto('https://www.aritzia.com/us/en/sale', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Wait for products to load
    await page.waitForTimeout(3000);

    console.log('📊 Extracting Aritzia products...');
    const products = await page.extract({
      instruction: `Extract sale products from this page. Look for clothing items that match: ${filters.clothingType || 'any type'}, size ${filters.size || 'any'}, max price $${filters.maxPrice || 'no limit'}. Extract the product title, brand (should be "aritzia"), original price, sale price, available sizes, clothing type, image URL, and product URL.`,
      schema: z.object({
        products: z.array(ProductSchema.extend({
          brand: z.literal('aritzia'),
        }))
      })
    });

    return products.products.map((product, index) => ({
      id: `aritzia-${index + 1}-${Date.now()}`,
      title: product.title,
      brand: 'aritzia' as const,
      originalPrice: product.originalPrice,
      salePrice: product.salePrice,
      size: product.size,
      clothingType: product.clothingType,
      imageUrl: product.imageUrl,
      productUrl: product.productUrl,
      inStock: product.inStock,
      scrapedAt: new Date(),
    }));
  }

  private async scrapeReformation(page: any, filters: SearchFilters): Promise<Deal[]> {
    console.log('🔍 Navigating to Reformation sale page...');
    await page.goto('https://www.thereformation.com/sale', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Wait for products to load
    await page.waitForTimeout(3000);

    console.log('📊 Extracting Reformation products...');
    const products = await page.extract({
      instruction: `Extract sale products from this page. Look for clothing items that match: ${filters.clothingType || 'any type'}, size ${filters.size || 'any'}, max price $${filters.maxPrice || 'no limit'}. Extract the product title, brand (should be "reformation"), original price, sale price, available sizes, clothing type, image URL, and product URL.`,
      schema: z.object({
        products: z.array(ProductSchema.extend({
          brand: z.literal('reformation'),
        }))
      })
    });

    return products.products.map((product, index) => ({
      id: `reformation-${index + 1}-${Date.now()}`,
      title: product.title,
      brand: 'reformation' as const,
      originalPrice: product.originalPrice,
      salePrice: product.salePrice,
      size: product.size,
      clothingType: product.clothingType,
      imageUrl: product.imageUrl,
      productUrl: product.productUrl,
      inStock: product.inStock,
      scrapedAt: new Date(),
    }));
  }

  private async scrapeFreePeople(page: any, filters: SearchFilters): Promise<Deal[]> {
    console.log('🔍 Navigating to Free People sale page...');
    await page.goto('https://www.freepeople.com/sale', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Wait for products to load
    await page.waitForTimeout(3000);

    console.log('📊 Extracting Free People products...');
    const products = await page.extract({
      instruction: `Extract sale products from this page. Look for clothing items that match: ${filters.clothingType || 'any type'}, size ${filters.size || 'any'}, max price $${filters.maxPrice || 'no limit'}. Extract the product title, brand (should be "free-people"), original price, sale price, available sizes, clothing type, image URL, and product URL.`,
      schema: z.object({
        products: z.array(ProductSchema.extend({
          brand: z.literal('free-people'),
        }))
      })
    });

    return products.products.map((product, index) => ({
      id: `freepeople-${index + 1}-${Date.now()}`,
      title: product.title,
      brand: 'free-people' as const,
      originalPrice: product.originalPrice,
      salePrice: product.salePrice,
      size: product.size,
      clothingType: product.clothingType,
      imageUrl: product.imageUrl,
      productUrl: product.productUrl,
      inStock: product.inStock,
      scrapedAt: new Date(),
    }));
  }
}
