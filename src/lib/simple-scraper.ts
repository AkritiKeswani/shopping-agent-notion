import { z } from 'zod';
import { Stagehand } from '@browserbasehq/stagehand';
import { Deal, ScrapingResult, SearchFilters } from '@/types';

const ProductSchema = z.object({
  title: z.string(),
  originalPrice: z.number().optional(),
  salePrice: z.number(),
  imageUrl: z.string().optional(),
  productUrl: z.string().optional(),
  size: z.string().optional(),
  inStock: z.boolean().optional(),
});

export class SimpleScraper {
  private stagehand: Stagehand | null = null;

  async initialize(): Promise<void> {
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
  }

  async cleanup(): Promise<void> {
    if (this.stagehand) {
      await this.stagehand.close();
      this.stagehand = null;
    }
  }

  async scrapeAllBrands(filters: SearchFilters): Promise<ScrapingResult> {
    const errors: string[] = [];
    const allDeals: Deal[] = [];

    try {
      console.log('🚀 Starting REAL scraping - no mock data...');
      
      if (!this.stagehand) {
        await this.initialize();
      }

      // Scrape each brand with proper error handling
      const [aritziaResult, reformationResult, freePeopleResult] = await Promise.allSettled([
        this.scrapeAritzia(filters),
        this.scrapeReformation(filters),
        this.scrapeFreePeople(filters),
      ]);

      if (aritziaResult.status === 'fulfilled') {
        allDeals.push(...aritziaResult.value);
        console.log(`✅ Aritzia: ${aritziaResult.value.length} deals`);
      } else {
        errors.push(`Aritzia failed: ${aritziaResult.reason}`);
        console.log(`❌ Aritzia failed: ${aritziaResult.reason}`);
      }

      if (reformationResult.status === 'fulfilled') {
        allDeals.push(...reformationResult.value);
        console.log(`✅ Reformation: ${reformationResult.value.length} deals`);
      } else {
        errors.push(`Reformation failed: ${reformationResult.reason}`);
        console.log(`❌ Reformation failed: ${reformationResult.reason}`);
      }

      if (freePeopleResult.status === 'fulfilled') {
        allDeals.push(...freePeopleResult.value);
        console.log(`✅ Free People: ${freePeopleResult.value.length} deals`);
      } else {
        errors.push(`Free People failed: ${freePeopleResult.reason}`);
        console.log(`❌ Free People failed: ${freePeopleResult.reason}`);
      }

    } catch (error) {
      errors.push(`General scraping error: ${error}`);
    }

    return {
      deals: allDeals,
      totalFound: allDeals.length,
      errors,
    };
  }

  private async scrapeAritzia(filters: SearchFilters): Promise<Deal[]> {
    if (!this.stagehand) throw new Error('Stagehand not initialized');

    const page = this.stagehand.page;
    const deals: Deal[] = [];

    try {
      console.log('🛍️ Scraping Aritzia...');
      
      // Try sale page with better timeout
      await page.goto('https://www.aritzia.com/us/en/sale', { 
        waitUntil: 'domcontentloaded', 
        timeout: 25000 
      });
      await page.waitForTimeout(3000);

      const products = await page.extract({
        instruction: `Find clothing products on this page. Look for any items with prices. For each product, extract: title, price (if there are two prices, use the higher one as original and lower as sale), image URL, and product URL.`,
        schema: z.object({
          products: z.array(ProductSchema),
        }),
      });

      deals.push(...this.parseBrandResults(products.products, 'aritzia'));
      console.log(`✅ Aritzia: Found ${deals.length} real deals`);

    } catch (error) {
      console.error('❌ Aritzia scraping failed:', error);
      throw error; // Don't return mock data
    }

    return deals;
  }

  private async scrapeReformation(filters: SearchFilters): Promise<Deal[]> {
    if (!this.stagehand) throw new Error('Stagehand not initialized');

    const page = this.stagehand.page;
    const deals: Deal[] = [];

    try {
      console.log('🌿 Scraping Reformation main page...');
      
      await page.goto('https://www.thereformation.com', { 
        waitUntil: 'domcontentloaded', 
        timeout: 25000 
      });
      await page.waitForTimeout(3000);

      const products = await page.extract({
        instruction: `Find the main featured products on this Reformation homepage. Look for best sellers, featured items, or highlighted products. For each item, extract: title, price (if there are two prices, use the higher one as original and lower as sale), image URL, and product URL. Focus on the main hero section and featured products.`,
        schema: z.object({
          products: z.array(ProductSchema),
        }),
      });

      deals.push(...this.parseBrandResults(products.products, 'reformation'));
      console.log(`✅ Reformation: Found ${deals.length} real deals`);

    } catch (error) {
      console.error('❌ Reformation scraping failed:', error);
      throw error; // Don't return empty array
    }

    return deals;
  }

  private async scrapeFreePeople(filters: SearchFilters): Promise<Deal[]> {
    if (!this.stagehand) throw new Error('Stagehand not initialized');

    const page = this.stagehand.page;
    const deals: Deal[] = [];

    try {
      console.log('🆓 Scraping Free People main page...');
      
      await page.goto('https://www.freepeople.com', { 
        waitUntil: 'domcontentloaded', 
        timeout: 25000 
      });
      await page.waitForTimeout(3000);

      const products = await page.extract({
        instruction: `Find the main featured products on this Free People homepage. Look for best sellers, featured items, or highlighted products. For each item, extract: title, price (if there are two prices, use the higher one as original and lower as sale), image URL, and product URL. Focus on the main hero section and featured products.`,
        schema: z.object({
          products: z.array(ProductSchema),
        }),
      });

      deals.push(...this.parseBrandResults(products.products, 'free-people'));
      console.log(`✅ Free People: Found ${deals.length} real deals`);

    } catch (error) {
      console.error('❌ Free People scraping failed:', error);
      throw error; // Don't return empty array
    }

    return deals;
  }

  private parseBrandResults(products: any[], brand: 'aritzia' | 'reformation' | 'free-people'): Deal[] {
    return products.map((product, index) => ({
      id: `${brand}-${index}-${Date.now()}`,
      title: product.title || 'Unknown Product',
      brand,
      originalPrice: product.originalPrice || product.salePrice || 0,
      salePrice: product.salePrice || 0,
      size: product.size || 'One Size',
      clothingType: this.mapClothingType(product.category || 'top'),
      imageUrl: product.imageUrl || '',
      productUrl: product.productUrl || '',
      inStock: product.inStock !== false,
      scrapedAt: new Date(),
    }));
  }

  private mapClothingType(category: string): 'jeans' | 'shirt' | 'dress' | 'top' | 'bottom' | 'outerwear' | 'accessories' {
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('jean') || lowerCategory.includes('denim')) return 'jeans';
    if (lowerCategory.includes('shirt') || lowerCategory.includes('blouse')) return 'shirt';
    if (lowerCategory.includes('dress')) return 'dress';
    if (lowerCategory.includes('top') || lowerCategory.includes('tee') || lowerCategory.includes('tank')) return 'top';
    if (lowerCategory.includes('pant') || lowerCategory.includes('short') || lowerCategory.includes('skirt')) return 'bottom';
    if (lowerCategory.includes('jacket') || lowerCategory.includes('coat') || lowerCategory.includes('sweater')) return 'outerwear';
    if (lowerCategory.includes('bag') || lowerCategory.includes('shoe') || lowerCategory.includes('jewelry')) return 'accessories';
    
    return 'top';
  }

}
