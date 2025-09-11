import { BackgroundAgentsService } from './background-agents';
import { Deal, ScrapingResult, SearchFilters } from '@/types';

export class ShoppingScraper {
  private backgroundAgents: BackgroundAgentsService;

  constructor() {
    this.backgroundAgents = new BackgroundAgentsService();
  }

  async scrapeAllBrands(filters: SearchFilters): Promise<ScrapingResult> {
    try {
      // Use Background Agents to handle the scraping task
      const agent = await this.backgroundAgents.runScrapingTask(filters);
      
      // Poll for completion
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max
      
      while (attempts < maxAttempts) {
        const status = await this.backgroundAgents.getAgentStatus(agent.result.agentId);
        
        if (status.status === 'completed') {
          return this.parseScrapingResults(status.result, filters);
        } else if (status.status === 'failed') {
          return {
            deals: [],
            totalFound: 0,
            errors: ['Background agent task failed'],
          };
        }
        
        // Wait 10 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      }
      
      return {
        deals: [],
        totalFound: 0,
        errors: ['Scraping task timed out'],
      };
      
    } catch (error) {
      console.error('Scraping error:', error);
      return {
        deals: [],
        totalFound: 0,
        errors: [`Scraping failed: ${error}`],
      };
    }
  }

  private parseScrapingResults(result: any, filters: SearchFilters): ScrapingResult {
    const deals: Deal[] = [];
    const errors: string[] = [];

    try {
      // Parse the results from the background agent
      if (result.aritzia) {
        deals.push(...this.parseBrandResults(result.aritzia, 'aritzia'));
      }
      
      if (result.reformation) {
        deals.push(...this.parseBrandResults(result.reformation, 'reformation'));
      }
      
      if (result.freePeople) {
        deals.push(...this.parseBrandResults(result.freePeople, 'free-people'));
      }

      // Apply filters
      const filteredDeals = this.filterProducts(deals, filters);

      return {
        deals: filteredDeals,
        totalFound: filteredDeals.length,
        errors,
      };
      
    } catch (error) {
      errors.push(`Failed to parse results: ${error}`);
      return {
        deals: [],
        totalFound: 0,
        errors,
      };
    }
  }

  private parseBrandResults(products: any[], brand: 'aritzia' | 'reformation' | 'free-people'): Deal[] {
    return products.map((product, index) => ({
      id: `${brand}-${index}-${Date.now()}`,
      title: product.title || product.name || 'Unknown Product',
      brand,
      originalPrice: parseFloat(product.originalPrice) || 0,
      salePrice: parseFloat(product.salePrice) || 0,
      discount: this.calculateDiscount(
        parseFloat(product.originalPrice) || 0,
        parseFloat(product.salePrice) || 0
      ),
      size: product.size || 'One Size',
      clothingType: this.mapClothingType(product.category || product.type),
      imageUrl: product.imageUrl || product.image || '',
      productUrl: product.productUrl || product.url || '',
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
    
    return 'top'; // default
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