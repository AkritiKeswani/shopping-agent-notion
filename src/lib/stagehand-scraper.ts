import { z } from 'zod';
import { Stagehand } from '@browserbasehq/stagehand';
import { Deal, ScrapingResult, SearchFilters } from '@/types';

const ProductSchema = z.object({
  title: z.string(),
  originalPrice: z.number(),
  salePrice: z.number(),
  imageUrl: z.string(),
  productUrl: z.string(),
  size: z.string().optional(),
  inStock: z.boolean(),
});

export class StagehandScraper {
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
      const [aritziaDeals, reformationDeals, freePeopleDeals] = await Promise.allSettled([
        this.scrapeAritzia(filters),
        this.scrapeReformation(filters),
        this.scrapeFreePeople(filters),
      ]);

      if (aritziaDeals.status === 'fulfilled') {
        allDeals.push(...aritziaDeals.value);
      } else {
        errors.push(`Aritzia scraping failed: ${aritziaDeals.reason}`);
      }

      if (reformationDeals.status === 'fulfilled') {
        allDeals.push(...reformationDeals.value);
      } else {
        errors.push(`Reformation scraping failed: ${reformationDeals.reason}`);
      }

      if (freePeopleDeals.status === 'fulfilled') {
        allDeals.push(...freePeopleDeals.value);
      } else {
        errors.push(`Free People scraping failed: ${freePeopleDeals.reason}`);
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
      const baseUrl = 'https://www.aritzia.com';
      const saleUrls = {
        'jeans': `${baseUrl}/us/en/sale/denim`,
        'shirt': `${baseUrl}/us/en/sale/tops`,
        'dress': `${baseUrl}/us/en/sale/dresses`,
        'top': `${baseUrl}/us/en/sale/tops`,
        'bottom': `${baseUrl}/us/en/sale/bottoms`,
        'outerwear': `${baseUrl}/us/en/sale/outerwear`,
        'accessories': `${baseUrl}/us/en/sale/accessories`,
      };

      const url = filters.clothingType ? saleUrls[filters.clothingType as keyof typeof saleUrls] : `${baseUrl}/us/en/sale`;

      await page.goto(url);

      // Wait for products to load
      await page.waitForSelector('[data-testid="product-tile"], .product-tile, .product-item', { timeout: 10000 });

      // Extract products using Stagehand's AI-powered extraction
      const products = await page.extract({
        instruction: `Extract all sale products from this page. For each product, get the title, original price, sale price, image URL, and product URL. If there's only one price shown, use it as both original and sale price.`,
        schema: z.object({
          products: z.array(ProductSchema),
        }),
      });

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
      const baseUrl = 'https://www.thereformation.com';
      const saleUrls = {
        'jeans': `${baseUrl}/collections/sale-denim`,
        'shirt': `${baseUrl}/collections/sale-tops`,
        'dress': `${baseUrl}/collections/sale-dresses`,
        'top': `${baseUrl}/collections/sale-tops`,
        'bottom': `${baseUrl}/collections/sale-bottoms`,
        'outerwear': `${baseUrl}/collections/sale-outerwear`,
        'accessories': `${baseUrl}/collections/sale-accessories`,
      };

      const url = filters.clothingType ? saleUrls[filters.clothingType as keyof typeof saleUrls] : `${baseUrl}/collections/sale`;

      await page.goto(url);

      await page.waitForSelector('.product-item, .product-card, [data-product]', { timeout: 10000 });

      const products = await page.extract({
        instruction: `Extract all sale products from this Reformation sale page. For each product, get the title, original price, sale price, image URL, and product URL.`,
        schema: z.object({
          products: z.array(ProductSchema),
        }),
      });

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
      const baseUrl = 'https://www.freepeople.com';
      const saleUrls = {
        'jeans': `${baseUrl}/sale/denim`,
        'shirt': `${baseUrl}/sale/tops`,
        'dress': `${baseUrl}/sale/dresses`,
        'top': `${baseUrl}/sale/tops`,
        'bottom': `${baseUrl}/sale/bottoms`,
        'outerwear': `${baseUrl}/sale/outerwear`,
        'accessories': `${baseUrl}/sale/accessories`,
      };

      const url = filters.clothingType ? saleUrls[filters.clothingType as keyof typeof saleUrls] : `${baseUrl}/sale`;

      await page.goto(url);

      await page.waitForSelector('.product-item, .product-tile, [data-product]', { timeout: 10000 });

      const products = await page.extract({
        instruction: `Extract all sale products from this Free People sale page. For each product, get the title, original price, sale price, image URL, and product URL.`,
        schema: z.object({
          products: z.array(ProductSchema),
        }),
      });

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
      originalPrice: product.originalPrice || 0,
      salePrice: product.salePrice || 0,
      discount: this.calculateDiscount(product.originalPrice || 0, product.salePrice || 0),
      size: product.size || 'One Size',
      clothingType: this.mapClothingType(product.category || 'top'),
      imageUrl: product.imageUrl || '',
      productUrl: product.productUrl || '',
      inStock: product.inStock !== false,
      scrapedAt: new Date(),
    }));
  }

  private calculateDiscount(originalPrice: number, salePrice: number): number {
    if (originalPrice === 0) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
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
