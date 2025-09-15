import { Deal, ScrapingResult, SearchFilters } from '@/types';
import { chromium, Page } from 'playwright';
import { Browserbase } from '@browserbasehq/sdk';
import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';

export class CustomScrapers {
  private browserbase: Browserbase;
  private stagehand: Stagehand | null = null;

  constructor() {
    if (!process.env.BROWSERBASE_API_KEY || !process.env.BROWSERBASE_PROJECT_ID) {
      throw new Error('Missing required environment variables: BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID');
    }
    
    this.browserbase = new Browserbase({
      apiKey: process.env.BROWSERBASE_API_KEY!,
    });
  }

  async scrapeAllBrands(filters: SearchFilters): Promise<ScrapingResult> {
    const deals: Deal[] = [];
    const errors: string[] = [];

    try {
      console.log('🚀 Starting Stagehand MCP Browserbase scraper...');
      console.log('📋 Filters:', filters);
      
      // Initialize Stagehand with retry logic
      console.log('🔧 Initializing Stagehand...');
      await this.initializeWithRetry();
      const page = this.stagehand!.page;
      console.log('✅ Stagehand initialized successfully!');
      console.log('🌐 Session initialized successfully');

      // Scrape each brand using advanced Stagehand methods
      if (!filters.brands || filters.brands.includes('aritzia')) {
        console.log('🛍️ Scraping Aritzia with Stagehand MCP...');
        try {
          const aritziaDeals = await this.scrapeAritziaAdvanced(page, filters);
          deals.push(...aritziaDeals);
          console.log(`✅ Found ${aritziaDeals.length} deals from Aritzia`);
        } catch (error) {
          console.error('❌ Aritzia scraping failed:', error);
          errors.push(`Aritzia: ${error}`);
        }
      }

      if (!filters.brands || filters.brands.includes('reformation')) {
        console.log('🛍️ Scraping Reformation with Stagehand MCP...');
        try {
          const reformationDeals = await this.scrapeReformationAdvanced(page, filters);
          deals.push(...reformationDeals);
          console.log(`✅ Found ${reformationDeals.length} deals from Reformation`);
        } catch (error) {
          console.error('❌ Reformation scraping failed:', error);
          errors.push(`Reformation: ${error}`);
        }
      }

      console.log(`🎉 Total deals found: ${deals.length}`);

      return {
        deals,
        totalFound: deals.length,
        errors,
      };

    } catch (error) {
      console.error('❌ Stagehand MCP scraping error:', error);
      return {
        deals: [],
        totalFound: 0,
        errors: [`Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    } finally {
      if (this.stagehand) {
        console.log('🔒 Closing Stagehand session...');
        try {
        await this.stagehand.close();
          console.log('✅ Stagehand session closed');
        } catch (closeError) {
          console.error('❌ Error closing session:', closeError);
        }
      }
    }
  }

  private async initializeWithRetry(maxRetries: number = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Create Stagehand instance with advanced configuration
        if (!this.stagehand) {
    this.stagehand = new Stagehand({
      env: 'BROWSERBASE',
      apiKey: process.env.BROWSERBASE_API_KEY!,
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
            modelName: 'gpt-4o', // Use GPT-4o for better performance
      modelClientOptions: {
        apiKey: process.env.OPENAI_API_KEY!,
      },
            // Advanced configuration for better stealth
            experimental: true, // Enable shadow DOM support
            verbose: 2, // Enable detailed logging for debugging
          });
        }
        
        await this.stagehand.init();
        
        // Configure advanced stealth settings
        const page = this.stagehand.page;
        await this.configureAdvancedStealth(page);
        
        return;
      } catch (error: any) {
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          const waitTime = attempt * 30;
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        } else if (attempt === maxRetries) {
          throw error;
        } else {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
  }

  private async configureAdvancedStealth(page: any): Promise<void> {
    console.log('🔧 Configuring advanced stealth settings...');
    
    // Stagehand handles stealth automatically, just log that we're ready
    console.log('✅ Advanced stealth settings configured by Stagehand');
  }

  private async handleChallenges(page: any, site: string): Promise<void> {
    console.log('🔍 Checking for Cloudflare challenges...');
    
    // Check for various challenge indicators using Stagehand's observe method
    const challengeIndicators = await (page as any).observe("Find Cloudflare challenge, Turnstile, or 'Just a moment' elements");
    
    if (challengeIndicators && challengeIndicators.length > 0) {
      console.log('🛡️ Cloudflare challenge detected!');
      console.log('👤 Please solve the challenge in the Browserbase session...');
      
      // Notify human and wait for challenge completion
      try {
        console.log("Cloudflare challenge detected. Please solve in the live session.");
        
        // Wait for challenge completion
        await page.waitForFunction(() => {
          return document.cookie.includes('cf_clearance') || 
                 !document.title.includes('Just a moment') ||
                 !document.title.includes('Checking your browser');
        }, { timeout: 180000 }); // 3 minutes timeout
        
        console.log('✅ Challenge appears to be solved!');
      } catch (error) {
        console.log('❌ Challenge resolution timeout or failed');
        throw new Error('Failed to resolve Cloudflare challenge');
      }
    } else {
      // Also check page title and content
      const title = await page.title();
      const bodyText = await page.textContent('body').catch(() => '') || '';
      
      if (title.includes('Just a moment') || 
          title.includes('Checking your browser') ||
          title.includes('Please wait') ||
          bodyText.includes('cf-challenge') ||
          bodyText.includes('Cloudflare')) {
        
        console.log('🛡️ Challenge detected in page content');
        console.log('👤 Please solve the challenge in the Browserbase session...');
        
        try {
          console.log("Cloudflare challenge detected. Please solve in the live session.");
          
          await page.waitForFunction(() => {
            return document.cookie.includes('cf_clearance') || 
                   !document.title.includes('Just a moment') ||
                   !document.title.includes('Checking your browser');
          }, { timeout: 180000 });
          
          console.log('✅ Challenge appears to be solved!');
        } catch (error) {
          console.log('❌ Challenge resolution timeout or failed');
          throw new Error('Failed to resolve Cloudflare challenge');
        }
      } else {
        console.log('✅ No challenges detected, proceeding normally...');
      }
    }
  }

  private async scrapeAritziaAdvanced(page: any, filters: SearchFilters): Promise<Deal[]> {
    console.log('🔍 Starting Aritzia scraping with Stagehand...');
    
    try {
      // Go directly to Aritzia sale page
      console.log('🌐 Navigating to Aritzia sale page...');
      await page.goto('https://www.aritzia.com/us/en/sale', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Wait for page to load
      await page.waitForTimeout(5000);
      
      // Check for Cloudflare challenge and wait for it to resolve
      let title = await page.title();
      console.log(`📄 Initial page title: ${title}`);
      
      if (title.includes('Just a moment') || title.includes('Checking your browser')) {
        console.log('🛡️ Cloudflare challenge detected, waiting for resolution...');
        
        // Wait for the challenge to be resolved - try multiple times
        let attempts = 0;
        const maxAttempts = 8; // 2 minutes total
        
        while (attempts < maxAttempts) {
          await page.waitForTimeout(15000); // Wait 15 seconds
          title = await page.title();
          console.log(`📄 Attempt ${attempts + 1}: Page title: ${title}`);
          
          if (!title.includes('Just a moment') && !title.includes('Checking your browser')) {
            console.log('✅ Cloudflare challenge resolved!');
            break;
          }
          
          attempts++;
        }
        
        if (attempts >= maxAttempts) {
          console.log('❌ Cloudflare challenge not resolved after 2 minutes, continuing anyway...');
          // Continue scraping even if Cloudflare challenge isn't fully resolved
        }
      }
      
      // First, let's debug what's actually on the page
      console.log('📊 Debugging page content...');
      const pageInfo = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          bodyText: document.body.innerText.substring(0, 500),
          allElements: document.querySelectorAll('*').length,
          productElements: document.querySelectorAll('[class*="product"], [data-testid*="product"]').length
        };
      });
      console.log('📄 Page info:', pageInfo);

      // Use Stagehand extract directly (now that dependencies are fixed)
      console.log('📊 Using Stagehand extract directly...');
      try {
        const result = await (page as any).extract({
          instruction: "Extract product information from this Aritzia sale page. Look for clothing items in the product grid. Each product should have: 1) Product name, 2) Sale price, 3) Original price if shown, 4) Product image URL, 5) Product page URL (click on each product to get the full URL). Focus on items that are clearly on sale with discounted prices. Make sure to extract the complete product page URLs, not just relative paths.",
          schema: z.object({
            products: z.array(
              z.object({
                name: z.string().describe("the product name"),
                price: z.string().describe("the sale price"),
                imageUrl: z.string().url().describe("the product image URL"),
                productUrl: z.string().url().describe("the complete product page URL (must start with https://)"),
                inStock: z.boolean().describe("whether the product is in stock")
              })
            )
          })
        });
        
        console.log('🔍 Stagehand extraction result:', JSON.stringify(result, null, 2));
        const products = result.products || [];
        console.log(`📊 Extracted ${products.length} products from Aritzia via Stagehand AI`);
        
        // Debug URL extraction
        products.forEach((product: any, index: number) => {
          console.log(`🔗 Aritzia Product ${index + 1} URL: ${product.productUrl}`);
        });
        
        if (products.length > 0) {
          return products.map((product: any, index: number) => {
            // Parse price
            const priceMatch = product.price.match(/(\d+\.?\d*)/);
            const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
            
            return {
              id: `aritzia-${index + 1}-${Date.now()}`,
              title: product.name,
              brand: 'aritzia' as const,
              originalPrice: price * 1.4, // Estimate original price
              salePrice: price,
              size: filters.size || 'M',
              clothingType: (filters.clothingType as 'jeans' | 'shirt' | 'dress' | 'top' | 'bottom' | 'outerwear' | 'accessories') || 'top',
              imageUrl: product.imageUrl,
              productUrl: product.productUrl,
              inStock: true,
              scrapedAt: new Date(),
            };
          });
        }
        
        console.log('📊 No products found on Aritzia page');
        return [];
        
      } catch (extractError) {
        console.error('❌ Stagehand extraction failed:', extractError);
        console.log('🔄 Falling back to manual DOM extraction...');
        
        // Fallback to manual extraction if Stagehand fails
        const products = await page.evaluate(() => {
          const results = [];
          
          // Look for common product container patterns
          const productSelectors = [
            '[class*="product"]',
            '[class*="item"]',
            '[class*="card"]',
            '[data-testid*="product"]',
            '[data-testid*="item"]',
            '.product-item',
            '.item-card',
            '.product-card'
          ];
          
          let productElements: any[] = [];
          for (const selector of productSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              productElements = Array.from(elements);
              break;
            }
          }
          
          // If no specific product containers found, look for any elements with prices
          if (productElements.length === 0) {
            const allElements = document.querySelectorAll('*');
            productElements = Array.from(allElements).filter(el => {
              const text = el.textContent || '';
              return text.includes('$') && /\$\d+/.test(text) && text.length > 10;
            });
          }
          
          console.log(`Found ${productElements.length} potential product elements`);
          
          for (let i = 0; i < Math.min(productElements.length, 20); i++) {
            const el = productElements[i];
            const text = el.textContent || '';
            
            // Extract price from this element or its children
            let price = '';
            let name = '';
            let imageUrl = '';
            let productUrl = '';
            
            // Look for price in this element or its children
            const priceElements = el.querySelectorAll('*');
            for (const priceEl of priceElements) {
              const priceText = priceEl.textContent || '';
              if (priceText.includes('$') && /\$\d+/.test(priceText) && !price) {
                const priceMatch = priceText.match(/\$[\d,]+\.?\d*/);
                if (priceMatch) {
                  price = priceMatch[0];
                  break;
                }
              }
            }
            
            // Look for product name (longest text that's not a price)
            const textLines = text.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0);
            for (const line of textLines) {
              if (line.length > 10 && !line.includes('$') && !line.includes('Size') && !line.includes('Color') && !line.includes('Sale') && !line.includes('Shop') && !line.includes('New')) {
                if (line.length > name.length) {
                  name = line;
                }
              }
            }
            
            // Try to find image URL
            const imgEl = el.querySelector('img');
            if (imgEl && imgEl.src && !imgEl.src.includes('data:image')) {
              imageUrl = imgEl.src;
            }
            
            // Try to find product URL
            const linkEl = el.querySelector('a[href]');
            if (linkEl && linkEl.href && linkEl.href.includes('aritzia.com')) {
              productUrl = linkEl.href;
            }
            
            if (name && price && name.length > 5) {
              results.push({ 
                name: name.substring(0, 100), // Limit name length
                price, 
                imageUrl: imageUrl || 'https://via.placeholder.com/300x400?text=Aritzia+Sale',
                productUrl: productUrl || `https://www.aritzia.com/us/en/sale?search=${encodeURIComponent(name || '')}`
              });
              console.log(`Found product: ${name} - ${price}`);
            }
          }
          
          return results;
        });
        
        console.log(`📊 Fallback extraction found ${products.length} products from Aritzia`);
        return products.map((product: any, index: number) => {
          const priceMatch = product.price.match(/(\d+\.?\d*)/);
          const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
          
          return {
            id: `aritzia-${index + 1}-${Date.now()}`,
            title: product.name,
            brand: 'aritzia' as const,
            originalPrice: price * 1.4,
            salePrice: price,
            size: filters.size || 'M',
            clothingType: (filters.clothingType as 'jeans' | 'shirt' | 'dress' | 'top' | 'bottom' | 'outerwear' | 'accessories') || 'top',
            imageUrl: product.imageUrl,
            productUrl: product.productUrl,
            inStock: true,
            scrapedAt: new Date(),
          };
        });
      }
      
    } catch (error) {
      console.error('Aritzia scraping error:', error);
      throw error;
    }
  }

  private async scrapeReformationAdvanced(page: any, filters: SearchFilters): Promise<Deal[]> {
    console.log('🔍 Starting Reformation scraping with Stagehand...');
    
    try {
      // Go to Reformation sale page
      console.log('🌐 Navigating to Reformation sale page...');
      await page.goto('https://www.thereformation.com/sale', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Wait for page to load
      await page.waitForTimeout(5000);
      
      // Check for Cloudflare challenge and wait for it to resolve
      let title = await page.title();
      console.log(`📄 Initial page title: ${title}`);
      
      if (title.includes('Just a moment') || title.includes('Checking your browser')) {
        console.log('🛡️ Cloudflare challenge detected, waiting for resolution...');
        
        // Wait for the challenge to be resolved - try multiple times
        let attempts = 0;
        const maxAttempts = 8; // 2 minutes total
        
        while (attempts < maxAttempts) {
          await page.waitForTimeout(15000); // Wait 15 seconds
          title = await page.title();
          console.log(`📄 Attempt ${attempts + 1}: Page title: ${title}`);
          
          if (!title.includes('Just a moment') && !title.includes('Checking your browser')) {
            console.log('✅ Cloudflare challenge resolved!');
            break;
          }
          
          attempts++;
        }
        
        if (attempts >= maxAttempts) {
          console.log('❌ Cloudflare challenge not resolved after 2 minutes, continuing anyway...');
          // Continue scraping even if Cloudflare challenge isn't fully resolved
        }
      }
      
      // Use Stagehand extract directly (now that dependencies are fixed)
      console.log('📊 Using Stagehand extract directly...');
      try {
        const result = await (page as any).extract({
          instruction: "Extract product information from this Reformation sale page. Look for clothing items in the product grid. Each product should have: 1) Product name, 2) Sale price, 3) Original price if shown, 4) Product image URL, 5) Product page URL (click on each product to get the full URL). Focus on items that are clearly on sale with discounted prices. Make sure to extract the complete product page URLs, not just relative paths.",
          schema: z.object({
            products: z.array(
              z.object({
                name: z.string().describe("the product name"),
                price: z.string().describe("the sale price"),
                imageUrl: z.string().url().describe("the product image URL"),
                productUrl: z.string().url().describe("the complete product page URL (must start with https://)"),
                inStock: z.boolean().describe("whether the product is in stock")
              })
            )
          })
        });
        
        console.log(`📊 Extracted ${result.products?.length || 0} products from Reformation`);
        
        // Debug URL extraction
        if (result.products) {
          result.products.forEach((product: any, index: number) => {
            console.log(`🔗 Reformation Product ${index + 1} URL: ${product.productUrl}`);
          });
        }
        
        if (result.products && result.products.length > 0) {
          return result.products.map((product: any, index: number) => {
            // Parse price
            const priceStr = typeof product.price === 'string' ? product.price : String(product.price);
            console.log(`🔍 Reformation product ${index + 1} price string: "${priceStr}"`);
            const priceMatch = priceStr.match(/(\d+\.?\d*)/);
            const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
            console.log(`💰 Reformation product ${index + 1} parsed price: ${price}`);
            const originalPrice = Math.round(price * 1.4); // Estimate original price
            
            return {
              id: `reformation-${index + 1}-${Date.now()}`,
              title: product.name || 'Reformation Product',
              brand: 'reformation' as const,
              originalPrice: originalPrice,
              salePrice: price,
              size: filters.size || 'M',
              clothingType: (filters.clothingType as 'jeans' | 'shirt' | 'dress' | 'top' | 'bottom' | 'outerwear' | 'accessories') || 'top',
              imageUrl: product.imageUrl || '',
              productUrl: product.productUrl || `https://www.thereformation.com/sale?search=${encodeURIComponent(product.name || '')}`,
              inStock: product.inStock !== undefined ? product.inStock : true,
              scrapedAt: new Date(),
            };
          });
        }
        
        console.log('📊 No products found on Reformation page');
        return [];
        
      } catch (extractError) {
        console.error('❌ Reformation extraction failed:', extractError);
        console.log('🔄 Falling back to manual extraction...');
        
        // Fallback to manual extraction
        const products = await page.evaluate(() => {
          const results = [];
          const allElements = document.querySelectorAll('*');
          
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i];
            const text = el.textContent || '';
            
            if (text.includes('$') && /\$\d+/.test(text) && text.length > 20 && text.length < 200) {
              const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
              let name = '';
              let price = '';
              
              for (const line of lines) {
                if (line.includes('$') && /\$\d+/.test(line)) {
                  price = line;
                } else if (line.length > 10 && !line.includes('$') && !line.includes('Size') && !line.includes('Color')) {
                  name = line;
                }
              }
              
              if (name && price) {
                results.push({ name, price, imageUrl: '', productUrl: '' });
                if (results.length >= 10) break;
              }
            }
          }
          
          return results;
        });
        
        console.log(`📊 Fallback extraction found ${products.length} products from Reformation`);
        return products.map((product: any, index: number) => {
          console.log(`🔍 Reformation fallback product ${index + 1} price string: "${product.price}"`);
          const priceMatch = product.price.match(/(\d+\.?\d*)/);
          const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
          console.log(`💰 Reformation fallback product ${index + 1} parsed price: ${price}`);
          
          return {
            id: `reformation-${index + 1}-${Date.now()}`,
            title: product.name || 'Reformation Product',
            brand: 'reformation' as const,
            originalPrice: Math.round(price * 1.4),
            salePrice: price,
            size: filters.size || 'M',
            clothingType: (filters.clothingType as 'jeans' | 'shirt' | 'dress' | 'top' | 'bottom' | 'outerwear' | 'accessories') || 'top',
            imageUrl: product.imageUrl || '',
            productUrl: product.productUrl || 'https://www.thereformation.com/sale',
            inStock: true,
            scrapedAt: new Date(),
          };
        });
      }
      
    } catch (error) {
      console.error('Reformation scraping error:', error);
      throw error;
    }
  }
}