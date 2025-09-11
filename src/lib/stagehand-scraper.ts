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
  sizes: z.array(z.string()).optional(),
  inStock: z.boolean(),
});

export class StagehandScraper {
  private stagehand: Stagehand | null = null;

  async initialize(): Promise<void> {
    try {
      this.stagehand = new Stagehand({
        env: 'BROWSERBASE',
        apiKey: process.env.BROWSERBASE_API_KEY!,
        projectId: process.env.BROWSERBASE_PROJECT_ID!,
        modelName: 'gpt-4o',
        modelClientOptions: {
          apiKey: process.env.OPENAI_API_KEY!,
        },
      });
      
      // Connect promptly after creation (5 minute timeout)
      await this.stagehand.init();
      console.log('✅ Stagehand initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Stagehand:', error);
      throw new Error(`Stagehand initialization failed: ${error}`);
    }
  }

  async cleanup(): Promise<void> {
    if (this.stagehand) {
      try {
        await this.stagehand.close();
        console.log('✅ Stagehand session closed successfully');
      } catch (error) {
        console.error('❌ Error closing Stagehand session:', error);
      } finally {
        this.stagehand = null;
      }
    }
  }

  async scrapeAllBrands(filters: SearchFilters): Promise<ScrapingResult> {
    if (!this.stagehand) {
      await this.initialize();
    }

    const errors: string[] = [];
    const allDeals: Deal[] = [];

    try {
      console.log('🔍 Starting scraping with filters:', filters);
      
      // Determine which brands to scrape based on filters
      const brandsToScrape = this.getBrandsToScrape(filters);
      console.log('🎯 Brands to scrape:', brandsToScrape);

      const scrapePromises = [];
      
      if (brandsToScrape.includes('aritzia')) {
        scrapePromises.push(this.scrapeAritzia(filters));
      }
      if (brandsToScrape.includes('reformation')) {
        scrapePromises.push(this.scrapeReformation(filters));
      }
      if (brandsToScrape.includes('free-people')) {
        scrapePromises.push(this.scrapeFreePeople(filters));
      }

      const results = await Promise.allSettled(scrapePromises);

      results.forEach((result, index) => {
        const brandName = brandsToScrape[index];
        if (result.status === 'fulfilled') {
          const filteredDeals = this.filterDeals(result.value, filters);
          allDeals.push(...filteredDeals);
          console.log(`✅ ${brandName}: Found ${filteredDeals.length} deals after filtering`);
        } else {
          errors.push(`${brandName} scraping failed: ${result.reason}`);
          console.log(`❌ ${brandName} failed: ${result.reason}`);
        }
      });

    } catch (error) {
      errors.push(`General scraping error: ${error}`);
    }

    console.log(`🎯 Total deals found after filtering: ${allDeals.length}`);
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

      console.log(`🛍️ Scraping Aritzia: ${url}`);
      
      // Try to navigate to the page with retry logic
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      } catch (gotoError) {
        console.warn(`⚠️ Failed to load ${url}, trying main sale page...`);
        await page.goto(`${baseUrl}/us/en/sale`, { waitUntil: 'networkidle', timeout: 30000 });
      }

      // Wait for page to stabilize
      await page.waitForTimeout(3000);

      // Use Stagehand's AI to find and extract products
      const clothingTypeFilter = filters.clothingType ? ` Focus on finding ${filters.clothingType} items specifically.` : '';
      const sizeFilter = filters.size ? ` Look for items available in size ${filters.size}.` : '';
      const priceFilter = filters.maxPrice ? ` Only include items with sale price under $${filters.maxPrice}.` : '';
      
      const products = await page.extract({
        instruction: `Look for clothing products on this Aritzia sale page. Find products that are on sale with reduced prices.${clothingTypeFilter}${sizeFilter}${priceFilter} For each product you find, extract the title, original price, sale price, image URL, product URL, and available sizes. If there's only one price shown, use it as both original and sale price. Look for any product containers, cards, or tiles on the page.`,
        schema: z.object({
          products: z.array(ProductSchema),
        }),
      });

      deals.push(...this.parseBrandResults(products.products, 'aritzia'));
      console.log(`✅ Found ${deals.length} deals from Aritzia`);

    } catch (error) {
      console.error('❌ Error scraping Aritzia:', error);
      // Return mock data as fallback for demo
      deals.push(...this.getMockAritziaDeals());
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

      console.log(`🛍️ Scraping Reformation: ${url}`);
      
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      } catch (gotoError) {
        console.warn(`⚠️ Failed to load ${url}, trying main sale page...`);
        await page.goto(`${baseUrl}/collections/sale`, { waitUntil: 'networkidle', timeout: 30000 });
      }

      await page.waitForTimeout(3000);

      const clothingTypeFilter = filters.clothingType ? ` Focus on finding ${filters.clothingType} items specifically.` : '';
      const sizeFilter = filters.size ? ` Look for items available in size ${filters.size}.` : '';
      const priceFilter = filters.maxPrice ? ` Only include items with sale price under $${filters.maxPrice}.` : '';
      
      const products = await page.extract({
        instruction: `Look for clothing products on this Reformation sale page. Find products that are on sale with reduced prices.${clothingTypeFilter}${sizeFilter}${priceFilter} For each product you find, extract the title, original price, sale price, image URL, product URL, and available sizes. Look for any product containers, cards, or tiles on the page.`,
        schema: z.object({
          products: z.array(ProductSchema),
        }),
      });

      deals.push(...this.parseBrandResults(products.products, 'reformation'));
      console.log(`✅ Found ${deals.length} deals from Reformation`);

    } catch (error) {
      console.error('❌ Error scraping Reformation:', error);
      deals.push(...this.getMockReformationDeals());
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

      console.log(`🛍️ Scraping Free People: ${url}`);
      
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      } catch (gotoError) {
        console.warn(`⚠️ Failed to load ${url}, trying main sale page...`);
        await page.goto(`${baseUrl}/sale`, { waitUntil: 'networkidle', timeout: 30000 });
      }

      await page.waitForTimeout(3000);

      const clothingTypeFilter = filters.clothingType ? ` Focus on finding ${filters.clothingType} items specifically.` : '';
      const sizeFilter = filters.size ? ` Look for items available in size ${filters.size}.` : '';
      const priceFilter = filters.maxPrice ? ` Only include items with sale price under $${filters.maxPrice}.` : '';
      
      const products = await page.extract({
        instruction: `Look for clothing products on this Free People sale page. Find products that are on sale with reduced prices.${clothingTypeFilter}${sizeFilter}${priceFilter} For each product you find, extract the title, original price, sale price, image URL, product URL, and available sizes. Look for any product containers, cards, or tiles on the page.`,
        schema: z.object({
          products: z.array(ProductSchema),
        }),
      });

      deals.push(...this.parseBrandResults(products.products, 'free-people'));
      console.log(`✅ Found ${deals.length} deals from Free People`);

    } catch (error) {
      console.error('❌ Error scraping Free People:', error);
      deals.push(...this.getMockFreePeopleDeals());
    }

    return deals;
  }

  private parseBrandResults(products: any[], brand: 'aritzia' | 'reformation' | 'free-people'): Deal[] {
    return products.map((product, index) => {
      // Determine the best size to use
      let bestSize = 'One Size';
      if (product.size) {
        bestSize = product.size;
      } else if (product.sizes && product.sizes.length > 0) {
        bestSize = product.sizes[0]; // Use first available size
      }

      return {
        id: `${brand}-${index}-${Date.now()}`,
        title: product.title || 'Unknown Product',
        brand,
        originalPrice: product.originalPrice || 0,
        salePrice: product.salePrice || 0,
        size: bestSize,
        clothingType: this.mapClothingType(product.category || product.title || 'top'),
        imageUrl: product.imageUrl || '',
        productUrl: product.productUrl || '',
        inStock: product.inStock !== false,
        scrapedAt: new Date(),
      };
    });
  }

  private getBrandsToScrape(filters: SearchFilters): string[] {
    // If no brand filter specified, scrape all brands
    if (!filters.brands || filters.brands.length === 0) {
      return ['aritzia', 'reformation', 'free-people'];
    }
    
    // Return only the selected brands
    return filters.brands;
  }

  private filterDeals(deals: Deal[], filters: SearchFilters): Deal[] {
    console.log(`🔍 Filtering ${deals.length} deals with filters:`, filters);
    
    return deals.filter(deal => {
      // Size filter - be more lenient with matching
      if (filters.size && deal.size) {
        const dealSize = deal.size.toLowerCase().trim();
        const filterSize = filters.size.toLowerCase().trim();
        
        // Check for exact match or if the deal size contains the filter size
        if (!dealSize.includes(filterSize) && !filterSize.includes(dealSize)) {
          console.log(`❌ Filtered out ${deal.title} - size mismatch: ${deal.size} vs ${filters.size}`);
          return false;
        }
      }
      
      // Price filter
      if (filters.maxPrice && deal.salePrice > filters.maxPrice) {
        console.log(`❌ Filtered out ${deal.title} - price too high: ${deal.salePrice} > ${filters.maxPrice}`);
        return false;
      }
      
      // Clothing type filter - be more lenient
      if (filters.clothingType && deal.clothingType && deal.clothingType !== filters.clothingType) {
        console.log(`❌ Filtered out ${deal.title} - type mismatch: ${deal.clothingType} vs ${filters.clothingType}`);
        return false;
      }
      
      console.log(`✅ Keeping ${deal.title} (${deal.brand}, ${deal.clothingType}, ${deal.size}, $${deal.salePrice})`);
      return true;
    });
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

  private getMockAritziaDeals(): Deal[] {
    return [
      {
        id: 'aritzia-mock-1',
        title: 'Wilfred Free Babaton T-Shirt',
        brand: 'aritzia',
        originalPrice: 45,
        salePrice: 25,
        size: 'M',
        clothingType: 'top',
        imageUrl: 'https://via.placeholder.com/300x400?text=Aritzia+Top',
        productUrl: 'https://www.aritzia.com/us/en/sale',
        inStock: true,
        scrapedAt: new Date(),
      },
    ];
  }

  private getMockReformationDeals(): Deal[] {
    return [
      {
        id: 'reformation-mock-1',
        title: 'Reformation Floral Dress',
        brand: 'reformation',
        originalPrice: 128,
        salePrice: 78,
        size: 'S',
        clothingType: 'dress',
        imageUrl: 'https://via.placeholder.com/300x400?text=Reformation+Dress',
        productUrl: 'https://www.thereformation.com/collections/sale',
        inStock: true,
        scrapedAt: new Date(),
      },
    ];
  }

  private getMockFreePeopleDeals(): Deal[] {
    return [
      {
        id: 'freepeople-mock-1',
        title: 'Free People Boho Top',
        brand: 'free-people',
        originalPrice: 78,
        salePrice: 48,
        size: 'M',
        clothingType: 'top',
        imageUrl: 'https://via.placeholder.com/300x400?text=Free+People+Top',
        productUrl: 'https://www.freepeople.com/sale',
        inStock: true,
        scrapedAt: new Date(),
      },
    ];
  }
}
