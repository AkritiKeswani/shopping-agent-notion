import { StagehandScraper } from './stagehand-scraper';
import { Deal, ScrapingResult, SearchFilters } from '@/types';

export class ShoppingScraper {
  private stagehandScraper: StagehandScraper;

  constructor() {
    this.stagehandScraper = new StagehandScraper();
  }

  async scrapeAllBrands(filters: SearchFilters): Promise<ScrapingResult> {
    try {
      const result = await this.stagehandScraper.scrapeAllBrands(filters);
      
      // Apply additional filtering
      const filteredDeals = this.filterProducts(result.deals, filters);
      
      return {
        deals: filteredDeals,
        totalFound: filteredDeals.length,
        errors: result.errors,
      };
      
    } catch (error) {
      console.error('Scraping error:', error);
      return {
        deals: [],
        totalFound: 0,
        errors: [`Scraping failed: ${error}`],
      };
    } finally {
      await this.stagehandScraper.cleanup();
    }
  }

  private filterProducts(products: Deal[], filters: SearchFilters): Deal[] {
    return products.filter(product => {
      if (filters.size && !product.size.toLowerCase().includes(filters.size.toLowerCase())) return false;
      if (filters.maxPrice && product.salePrice > filters.maxPrice) return false;
      if (filters.minDiscount && product.discount < filters.minDiscount) return false;
      if (filters.brands && !filters.brands.includes(product.brand)) return false;
      if (filters.clothingType && product.clothingType !== filters.clothingType) return false;
      return true;
    });
  }
}