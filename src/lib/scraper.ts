import { SimpleScraper } from './simple-scraper';
import { Deal, ScrapingResult, SearchFilters } from '@/types';

export class ShoppingScraper {
  private simpleScraper: SimpleScraper;

  constructor() {
    this.simpleScraper = new SimpleScraper();
  }

  async scrapeAllBrands(filters: SearchFilters): Promise<ScrapingResult> {
    try {
      console.log('🔍 Starting simple scraping...');
      
      // Scrape main pages for best sellers
      const result = await this.simpleScraper.scrapeAllBrands(filters);
      console.log(`📊 Found ${result.deals.length} deals from main pages`);
      
      // Simple filtering - just basic criteria
      const filteredDeals = this.filterProducts(result.deals, filters);
      console.log(`🎯 After basic filtering: ${filteredDeals.length} deals`);
      
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
      // Cleanup handled internally by SimpleScraper
    }
  }

  private filterProducts(products: Deal[], filters: SearchFilters): Deal[] {
    return products.filter(product => {
      if (filters.size && !product.size.toLowerCase().includes(filters.size.toLowerCase())) return false;
      if (filters.maxPrice && product.salePrice > filters.maxPrice) return false;
      if (filters.brands && !filters.brands.includes(product.brand)) return false;
      if (filters.clothingType && product.clothingType !== filters.clothingType) return false;
      return true;
    });
  }
}