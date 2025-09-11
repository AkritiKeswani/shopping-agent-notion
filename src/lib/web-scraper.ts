import puppeteer, { Browser, Page } from 'puppeteer';
import { Deal, ScrapingResult, SearchFilters } from '@/types';

export class WebScraper {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeAllBrands(filters: SearchFilters): Promise<ScrapingResult> {
    if (!this.browser) {
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
    const page = await this.browser!.newPage();
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

      await page.goto(url, { waitUntil: 'networkidle2' });

      // Wait for products to load
      await page.waitForSelector('[data-testid="product-tile"], .product-tile, .product-item', { timeout: 10000 });

      const products = await page.evaluate(() => {
        const productElements = document.querySelectorAll('[data-testid="product-tile"], .product-tile, .product-item');
        const results: any[] = [];

        productElements.forEach((element, index) => {
          try {
            const titleElement = element.querySelector('h3, .product-title, [data-testid="product-title"]');
            const priceElement = element.querySelector('.price, .product-price, [data-testid="price"]');
            const imageElement = element.querySelector('img');
            const linkElement = element.querySelector('a');

            if (titleElement && priceElement) {
              const title = titleElement.textContent?.trim() || '';
              const priceText = priceElement.textContent?.trim() || '';
              const imageUrl = imageElement?.getAttribute('src') || '';
              const productUrl = linkElement?.getAttribute('href') || '';

              // Extract prices
              const priceMatch = priceText.match(/\$(\d+(?:\.\d{2})?)/g);
              const prices = priceMatch ? priceMatch.map(p => parseFloat(p.replace('$', ''))) : [];
              
              let originalPrice = 0;
              let salePrice = 0;

              if (prices.length === 2) {
                originalPrice = Math.max(...prices);
                salePrice = Math.min(...prices);
              } else if (prices.length === 1) {
                salePrice = prices[0];
                originalPrice = prices[0];
              }

              results.push({
                title,
                originalPrice,
                salePrice,
                imageUrl: imageUrl.startsWith('http') ? imageUrl : `https://www.aritzia.com${imageUrl}`,
                productUrl: productUrl.startsWith('http') ? productUrl : `https://www.aritzia.com${productUrl}`,
                brand: 'aritzia',
                inStock: true, // Assume in stock if shown
              });
            }
          } catch (error) {
            console.error('Error parsing product:', error);
          }
        });

        return results;
      });

      deals.push(...this.parseBrandResults(products, 'aritzia'));

    } catch (error) {
      console.error('Error scraping Aritzia:', error);
    } finally {
      await page.close();
    }

    return deals;
  }

  private async scrapeReformation(filters: SearchFilters): Promise<Deal[]> {
    const page = await this.browser!.newPage();
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

      await page.goto(url, { waitUntil: 'networkidle2' });

      await page.waitForSelector('.product-item, .product-card, [data-product]', { timeout: 10000 });

      const products = await page.evaluate(() => {
        const productElements = document.querySelectorAll('.product-item, .product-card, [data-product]');
        const results: any[] = [];

        productElements.forEach((element) => {
          try {
            const titleElement = element.querySelector('.product-title, h3, .product-name');
            const priceElement = element.querySelector('.price, .product-price');
            const imageElement = element.querySelector('img');
            const linkElement = element.querySelector('a');

            if (titleElement && priceElement) {
              const title = titleElement.textContent?.trim() || '';
              const priceText = priceElement.textContent?.trim() || '';
              const imageUrl = imageElement?.getAttribute('src') || '';
              const productUrl = linkElement?.getAttribute('href') || '';

              const priceMatch = priceText.match(/\$(\d+(?:\.\d{2})?)/g);
              const prices = priceMatch ? priceMatch.map(p => parseFloat(p.replace('$', ''))) : [];
              
              let originalPrice = 0;
              let salePrice = 0;

              if (prices.length === 2) {
                originalPrice = Math.max(...prices);
                salePrice = Math.min(...prices);
              } else if (prices.length === 1) {
                salePrice = prices[0];
                originalPrice = prices[0];
              }

              results.push({
                title,
                originalPrice,
                salePrice,
                imageUrl: imageUrl.startsWith('http') ? imageUrl : `https://www.thereformation.com${imageUrl}`,
                productUrl: productUrl.startsWith('http') ? productUrl : `https://www.thereformation.com${productUrl}`,
                brand: 'reformation',
                inStock: true,
              });
            }
          } catch (error) {
            console.error('Error parsing product:', error);
          }
        });

        return results;
      });

      deals.push(...this.parseBrandResults(products, 'reformation'));

    } catch (error) {
      console.error('Error scraping Reformation:', error);
    } finally {
      await page.close();
    }

    return deals;
  }

  private async scrapeFreePeople(filters: SearchFilters): Promise<Deal[]> {
    const page = await this.browser!.newPage();
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

      await page.goto(url, { waitUntil: 'networkidle2' });

      await page.waitForSelector('.product-item, .product-tile, [data-product]', { timeout: 10000 });

      const products = await page.evaluate(() => {
        const productElements = document.querySelectorAll('.product-item, .product-tile, [data-product]');
        const results: any[] = [];

        productElements.forEach((element) => {
          try {
            const titleElement = element.querySelector('.product-title, h3, .product-name');
            const priceElement = element.querySelector('.price, .product-price');
            const imageElement = element.querySelector('img');
            const linkElement = element.querySelector('a');

            if (titleElement && priceElement) {
              const title = titleElement.textContent?.trim() || '';
              const priceText = priceElement.textContent?.trim() || '';
              const imageUrl = imageElement?.getAttribute('src') || '';
              const productUrl = linkElement?.getAttribute('href') || '';

              const priceMatch = priceText.match(/\$(\d+(?:\.\d{2})?)/g);
              const prices = priceMatch ? priceMatch.map(p => parseFloat(p.replace('$', ''))) : [];
              
              let originalPrice = 0;
              let salePrice = 0;

              if (prices.length === 2) {
                originalPrice = Math.max(...prices);
                salePrice = Math.min(...prices);
              } else if (prices.length === 1) {
                salePrice = prices[0];
                originalPrice = prices[0];
              }

              results.push({
                title,
                originalPrice,
                salePrice,
                imageUrl: imageUrl.startsWith('http') ? imageUrl : `https://www.freepeople.com${imageUrl}`,
                productUrl: productUrl.startsWith('http') ? productUrl : `https://www.freepeople.com${productUrl}`,
                brand: 'free-people',
                inStock: true,
              });
            }
          } catch (error) {
            console.error('Error parsing product:', error);
          }
        });

        return results;
      });

      deals.push(...this.parseBrandResults(products, 'free-people'));

    } catch (error) {
      console.error('Error scraping Free People:', error);
    } finally {
      await page.close();
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
      size: 'One Size', // We'll need to scrape this separately
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
