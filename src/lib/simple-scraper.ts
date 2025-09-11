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
    if (!this.stagehand) {
      await this.initialize();
    }

    const errors: string[] = [];
    const allDeals: Deal[] = [];

    try {
      // Try each brand one by one to avoid conflicts
      const aritziaDeals = await this.scrapeAritzia(filters);
      allDeals.push(...aritziaDeals);
      
      const reformationDeals = await this.scrapeReformation(filters);
      allDeals.push(...reformationDeals);
      
      const freePeopleDeals = await this.scrapeFreePeople(filters);
      allDeals.push(...freePeopleDeals);

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
      
      // Try the main sale page first
      await page.goto('https://www.aritzia.com/us/en/sale', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(5000);

      const products = await page.extract({
        instruction: `Find all clothing items on this Aritzia sale page. Look for any products that are on sale. For each item, extract: title, price (if there are two prices, use the higher one as original and lower as sale), image URL, and product URL.`,
        schema: z.object({
          products: z.array(ProductSchema),
        }),
      });

      console.log(`Found ${products.products.length} products from Aritzia`);
      deals.push(...this.parseBrandResults(products.products, 'aritzia'));

    } catch (error) {
      console.error('Error scraping Aritzia:', error);
    }

    return deals;
  }

  private async scrapeReformation(filters: SearchFilters): Promise<Deal[]> {
    if (!this.stagehand) throw new Error('Stagehand not initialized');

    const page = this.stagehand.page;
    const deals: Deal[] = [];

    try {
      console.log('🌿 Scraping Reformation...');
      
      await page.goto('https://www.thereformation.com/collections/sale', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(5000);

      const products = await page.extract({
        instruction: `Find all clothing items on this Reformation sale page. Look for any products that are on sale. For each item, extract: title, price (if there are two prices, use the higher one as original and lower as sale), image URL, and product URL.`,
        schema: z.object({
          products: z.array(ProductSchema),
        }),
      });

      console.log(`Found ${products.products.length} products from Reformation`);
      deals.push(...this.parseBrandResults(products.products, 'reformation'));

    } catch (error) {
      console.error('Error scraping Reformation:', error);
    }

    return deals;
  }

  private async scrapeFreePeople(filters: SearchFilters): Promise<Deal[]> {
    if (!this.stagehand) throw new Error('Stagehand not initialized');

    const page = this.stagehand.page;
    const deals: Deal[] = [];

    try {
      console.log('🆓 Scraping Free People...');
      
      await page.goto('https://www.freepeople.com/sale', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(5000);

      const products = await page.extract({
        instruction: `Find all clothing items on this Free People sale page. Look for any products that are on sale. For each item, extract: title, price (if there are two prices, use the higher one as original and lower as sale), image URL, and product URL.`,
        schema: z.object({
          products: z.array(ProductSchema),
        }),
      });

      console.log(`Found ${products.products.length} products from Free People`);
      deals.push(...this.parseBrandResults(products.products, 'free-people'));

    } catch (error) {
      console.error('Error scraping Free People:', error);
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
