import { Stagehand } from '@browserbasehq/stagehand';
import { Deal, ScrapingResult, SearchFilters } from '@/types';
import * as fs from 'fs';
import * as path from 'path';

export class ImprovedBrowserbaseScraper {
  private stagehand: Stagehand | null = null;
  private storageDir = './storage';

  constructor() {
    // Check for required environment variables
    if (!process.env.BROWSERBASE_API_KEY || !process.env.BROWSERBASE_PROJECT_ID || !process.env.OPENAI_API_KEY) {
      throw new Error('Missing required environment variables: BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID, or OPENAI_API_KEY');
    }

    // Ensure storage directory exists
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async scrapeAllBrands(filters: SearchFilters): Promise<ScrapingResult> {
    const deals: Deal[] = [];
    const errors: string[] = [];

    try {
      console.log('🚀 Starting improved Browserbase scraping with human-in-the-loop...');
      console.log('📋 Filters:', filters);

      // Initialize Stagehand with retry logic
      console.log('🔧 Initializing Stagehand...');
      await this.initializeWithRetry();
      const page = this.stagehand!.page;
      console.log('✅ Stagehand initialized successfully!');

      // Scrape each brand with improved flow
      if (!filters.brands || filters.brands.includes('aritzia')) {
        console.log('🛍️ Scraping Aritzia with natural browsing...');
        try {
          const aritziaDeals = await this.scrapeAritziaNatural(page, filters);
          deals.push(...aritziaDeals);
          console.log(`✅ Found ${aritziaDeals.length} deals from Aritzia`);
        } catch (error) {
          console.error('❌ Aritzia scraping failed:', error);
          errors.push(`Aritzia: ${error}`);
        }
      }

      if (!filters.brands || filters.brands.includes('reformation')) {
        console.log('🛍️ Scraping Reformation with natural browsing...');
        try {
          const reformationDeals = await this.scrapeReformationNatural(page, filters);
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
      console.error('❌ Improved scraping error:', error);
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
        // Create Stagehand instance if it doesn't exist
        if (!this.stagehand) {
          this.stagehand = new Stagehand({
            env: 'BROWSERBASE',
            apiKey: process.env.BROWSERBASE_API_KEY!,
            projectId: process.env.BROWSERBASE_PROJECT_ID!,
            modelName: 'gpt-4o',
            modelClientOptions: {
              apiKey: process.env.OPENAI_API_KEY!,
            },
          });
        }
        
        await this.stagehand.init();
        
        // Configure stealth settings immediately after initialization
        const page = this.stagehand.page;
        await this.configureStealthSettings(page);
        
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

  private async configureStealthSettings(page: any): Promise<void> {
    console.log('🔧 Configuring stealth settings...');
    
    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set timezone and locale
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', { value: 'en-US' });
      Object.defineProperty(navigator, 'languages', { value: ['en-US', 'en'] });
    });
    
    console.log('✅ Stealth settings configured');
  }

  private async loadStorageState(page: any, site: string): Promise<boolean> {
    const storagePath = path.join(this.storageDir, `${site}.json`);
    
    if (fs.existsSync(storagePath)) {
      try {
        console.log(`📁 Loading storage state for ${site}...`);
        const storageState = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
        await page.context().addCookies(storageState.cookies || []);
        console.log(`✅ Loaded storage state for ${site}`);
        return true;
      } catch (error) {
        console.log(`⚠️ Failed to load storage state for ${site}:`, error);
        return false;
      }
    }
    
    return false;
  }

  private async saveStorageState(page: any, site: string): Promise<void> {
    try {
      console.log(`💾 Saving storage state for ${site}...`);
      const storageState = await page.context().storageState();
      const storagePath = path.join(this.storageDir, `${site}.json`);
      fs.writeFileSync(storagePath, JSON.stringify(storageState, null, 2));
      console.log(`✅ Saved storage state for ${site}`);
    } catch (error) {
      console.log(`⚠️ Failed to save storage state for ${site}:`, error);
    }
  }

  private async detectAndHandleChallenge(page: any, site: string): Promise<boolean> {
    console.log('🔍 Checking for Cloudflare challenges...');
    
    // Check for various challenge indicators
    const challengeSelectors = [
      'iframe[title*="Turnstile"]',
      'iframe[title*="Cloudflare"]',
      '.cf-challenge-running',
      '#cf-challenge-running',
      '[data-ray]'
    ];
    
    let hasChallenge = false;
    for (const selector of challengeSelectors) {
      try {
        const isVisible = await page.locator(selector).first().isVisible().catch(() => false);
        if (isVisible) {
          hasChallenge = true;
          console.log(`🛡️ Challenge detected with selector: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue checking other selectors
      }
    }
    
    // Also check page title and content
    const title = await page.title();
    const bodyText = await page.textContent('body').catch(() => '');
    
    if (title.includes('Just a moment') || 
        title.includes('Checking your browser') ||
        title.includes('Please wait') ||
        bodyText.includes('cf-challenge') ||
        bodyText.includes('Cloudflare')) {
      hasChallenge = true;
      console.log('🛡️ Challenge detected in page content');
    }
    
    if (hasChallenge) {
      console.log('🛡️ Cloudflare challenge detected! Pausing for human intervention...');
      console.log('👤 Please solve the challenge in the Browserbase session and wait for completion...');
      
      // Notify human and wait for challenge completion
      try {
        await this.stagehand!.notify("Cloudflare challenge detected. Please solve in the live session.");
        
        // Wait for cf_clearance cookie or challenge completion
        await page.waitForFunction(() => {
          return document.cookie.includes('cf_clearance') || 
                 !document.title.includes('Just a moment') ||
                 !document.title.includes('Checking your browser');
        }, { timeout: 180000 }); // 3 minutes timeout
        
        console.log('✅ Challenge appears to be solved!');
        
        // Save storage state after successful challenge
        await this.saveStorageState(page, site);
        
        return true;
      } catch (error) {
        console.log('❌ Challenge resolution timeout or failed');
        return false;
      }
    }
    
    return true; // No challenge detected
  }

  private async naturalBrowsingFlow(page: any, site: string, searchQuery: string): Promise<void> {
    console.log(`🌐 Starting natural browsing flow for ${site}...`);
    
    // Step 1: Load storage state if available
    await this.loadStorageState(page, site);
    
    // Step 2: Start from homepage (natural entry point)
    console.log('🏠 Navigating to homepage...');
    const homepageUrls = {
      'aritzia': 'https://www.aritzia.com',
      'reformation': 'https://www.thereformation.com'
    };
    
    const homepageUrl = homepageUrls[site as keyof typeof homepageUrls];
    if (homepageUrl) {
      await page.goto(homepageUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Human-like delay
      await this.humanDelay(2000, 4000);
      
      // Step 3: Natural navigation - scroll and explore
      console.log('👀 Exploring homepage naturally...');
      await this.humanLikeScroll(page);
      await this.humanDelay(1000, 3000);
      
      // Step 4: Navigate to sale/category page
      console.log('🛍️ Navigating to sale section...');
      const saleUrls = {
        'aritzia': 'https://www.aritzia.com/us/en/sale',
        'reformation': 'https://www.thereformation.com/sale'
      };
      
      const saleUrl = saleUrls[site as keyof typeof saleUrls];
      if (saleUrl) {
        await page.goto(saleUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        // Check for and handle challenges
        const challengeResolved = await this.detectAndHandleChallenge(page, site);
        if (!challengeResolved) {
          throw new Error('Failed to resolve Cloudflare challenge');
        }
        
        // Human-like delay after navigation
        await this.humanDelay(2000, 4000);
        
        // Step 5: Natural exploration of the page
        console.log('🔍 Exploring sale page naturally...');
        await this.humanLikeScroll(page);
        await this.humanDelay(1000, 3000);
      }
    }
  }

  private async humanLikeScroll(page: any): Promise<void> {
    console.log('📜 Scrolling naturally...');
    
    // Get page height
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    
    // Scroll in chunks like a human would
    const scrollChunks = Math.ceil(pageHeight / viewportHeight);
    
    for (let i = 0; i < Math.min(scrollChunks, 3); i++) { // Limit to 3 scrolls
      const scrollTo = (i + 1) * viewportHeight * 0.7; // Don't scroll to the very bottom
      
      await page.evaluate((y) => {
        window.scrollTo({
          top: y,
          behavior: 'smooth'
        });
      }, scrollTo);
      
      // Random delay between scrolls
      await this.humanDelay(1000, 3000);
    }
  }

  private async humanDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await page.waitForTimeout(delay);
  }

  private async scrapeAritziaNatural(page: any, filters: SearchFilters): Promise<Deal[]> {
    console.log('🔍 Starting natural Aritzia scraping...');
    
    try {
      // Use natural browsing flow
      await this.naturalBrowsingFlow(page, 'aritzia', filters.clothingType || 'clothing');
      
      console.log('📊 Extracting Aritzia products using AI...');
      
      // Extract products with improved instruction
      const result = await page.extract({
        instruction: `Find all product items on this Aritzia sale page. Look for product cards, tiles, or listings. For each product, extract: title (product name), originalPrice (original price as number), salePrice (sale price as number), sizes (available sizes as array), clothingType (type of clothing), imageUrl (product image URL), productUrl (link to product page), and inStock (true/false). Focus on items that match the search criteria: ${filters.clothingType || 'clothing'}. Return as an array of products.`,
        schema: {
          products: [
            {
              title: 'string',
              originalPrice: 'number',
              salePrice: 'number', 
              sizes: ['string'],
              clothingType: 'string',
              imageUrl: 'string',
              productUrl: 'string',
              inStock: 'boolean'
            }
          ]
        }
      });
      
      console.log(`📊 Extracted ${result.products?.length || 0} products from Aritzia`);
      
      if (result.products && result.products.length > 0) {
        const deals = result.products.map((product: any, index: number) => ({
          id: `aritzia-${index + 1}-${Date.now()}`,
          title: product.title || 'Aritzia Product',
          brand: 'aritzia' as const,
          originalPrice: product.originalPrice || 0,
          salePrice: product.salePrice || 0,
          size: product.sizes?.[0] || filters.size || 'M',
          clothingType: product.clothingType || filters.clothingType || 'top',
          imageUrl: product.imageUrl || '',
          productUrl: product.productUrl || 'https://www.aritzia.com/us/en/sale',
          inStock: product.inStock !== undefined ? product.inStock : true,
          scrapedAt: new Date(),
        }));
        
        // Save storage state after successful extraction
        await this.saveStorageState(page, 'aritzia');
        
        return deals;
      }
      
      console.log('📊 No products found on Aritzia page');
      return [];
      
    } catch (error) {
      console.error('Aritzia scraping error:', error);
      throw error;
    }
  }

  private async scrapeReformationNatural(page: any, filters: SearchFilters): Promise<Deal[]> {
    console.log('🔍 Starting natural Reformation scraping...');
    
    try {
      // Use natural browsing flow
      await this.naturalBrowsingFlow(page, 'reformation', filters.clothingType || 'clothing');
      
      console.log('📊 Extracting Reformation products using AI...');
      
      // Extract products with improved instruction
      const result = await page.extract({
        instruction: `Find all product items on this Reformation sale page. Look for product cards, tiles, or listings. For each product, extract: title (product name), originalPrice (original price as number), salePrice (sale price as number), sizes (available sizes as array), clothingType (type of clothing), imageUrl (product image URL), productUrl (link to product page), and inStock (true/false). Focus on items that match the search criteria: ${filters.clothingType || 'clothing'}. Return as an array of products.`,
        schema: {
          products: [
            {
              title: 'string',
              originalPrice: 'number',
              salePrice: 'number', 
              sizes: ['string'],
              clothingType: 'string',
              imageUrl: 'string',
              productUrl: 'string',
              inStock: 'boolean'
            }
          ]
        }
      });
      
      console.log(`📊 Extracted ${result.products?.length || 0} products from Reformation`);
      
      if (result.products && result.products.length > 0) {
        const deals = result.products.map((product: any, index: number) => ({
          id: `reformation-${index + 1}-${Date.now()}`,
          title: product.title || 'Reformation Product',
          brand: 'reformation' as const,
          originalPrice: product.originalPrice || 0,
          salePrice: product.salePrice || 0,
          size: product.sizes?.[0] || filters.size || 'M',
          clothingType: product.clothingType || filters.clothingType || 'top',
          imageUrl: product.imageUrl || '',
          productUrl: product.productUrl || 'https://www.thereformation.com/sale',
          inStock: product.inStock !== undefined ? product.inStock : true,
          scrapedAt: new Date(),
        }));
        
        // Save storage state after successful extraction
        await this.saveStorageState(page, 'reformation');
        
        return deals;
      }
      
      console.log('📊 No products found on Reformation page');
      return [];
      
    } catch (error) {
      console.error('Reformation scraping error:', error);
      throw error;
    }
  }
}
