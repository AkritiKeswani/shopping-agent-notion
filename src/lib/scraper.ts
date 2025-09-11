import { SimpleScraper } from './simple-scraper';
import { AIOptimizer } from './ai-optimizer';
import { Deal, ScrapingResult, SearchFilters } from '@/types';

export class ShoppingScraper {
  private simpleScraper: SimpleScraper;
  private aiOptimizer: AIOptimizer;

  constructor() {
    this.simpleScraper = new SimpleScraper();
    this.aiOptimizer = new AIOptimizer();
  }

  async scrapeAllBrands(filters: SearchFilters, userPreferences?: string): Promise<ScrapingResult> {
    try {
      console.log('🔍 Starting scraping with AI optimization...');
      
      // First, scrape all deals
      const result = await this.simpleScraper.scrapeAllBrands(filters);
      console.log(`📊 Found ${result.deals.length} raw deals`);
      
      if (result.deals.length === 0) {
        return {
          deals: [],
          totalFound: 0,
          errors: result.errors,
        };
      }
      
      // Apply basic filtering first
      const filteredDeals = this.filterProducts(result.deals, filters);
      console.log(`🎯 After filtering: ${filteredDeals.length} deals`);
      
      // Use AI to optimize and select the best deals
      console.log('🤖 AI optimizing deals...');
      const optimization = await this.aiOptimizer.optimizeDeals(filteredDeals, filters, userPreferences);
      console.log(`✨ AI selected ${optimization.optimizedDeals.length} optimal deals`);
      console.log(`💭 AI reasoning: ${optimization.reasoning}`);
      
      return {
        deals: optimization.optimizedDeals,
        totalFound: optimization.optimizedDeals.length,
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
      await this.simpleScraper.cleanup();
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