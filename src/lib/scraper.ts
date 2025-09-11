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
    console.log(`🔍 Filtering ${products.length} products with filters:`, filters);
    
    const filtered = products.filter(product => {
      // Size filter - be more lenient
      if (filters.size && product.size && !product.size.toLowerCase().includes(filters.size.toLowerCase())) {
        console.log(`❌ Filtered out ${product.title} - size mismatch: ${product.size} vs ${filters.size}`);
        return false;
      }
      
      // Price filter
      if (filters.maxPrice && product.salePrice > filters.maxPrice) {
        console.log(`❌ Filtered out ${product.title} - price too high: ${product.salePrice} > ${filters.maxPrice}`);
        return false;
      }
      
      // Brand filter
      if (filters.brands && filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
        console.log(`❌ Filtered out ${product.title} - brand not in list: ${product.brand}`);
        return false;
      }
      
      // Clothing type filter - be more lenient
      if (filters.clothingType && product.clothingType && product.clothingType !== filters.clothingType) {
        console.log(`❌ Filtered out ${product.title} - type mismatch: ${product.clothingType} vs ${filters.clothingType}`);
        return false;
      }
      
      console.log(`✅ Keeping ${product.title} (${product.brand}, ${product.clothingType}, ${product.size}, $${product.salePrice})`);
      return true;
    });
    
    console.log(`🎯 Filtered to ${filtered.length} deals`);
    return filtered;
  }
}