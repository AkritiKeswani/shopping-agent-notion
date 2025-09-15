import { z } from 'zod';

export interface ReformationItem {
  name: string;
  price: number;
  url: string;
  imageUrl?: string;
}

export interface ReformationSearchParams {
  query: string;
  size: string;
  topN: number;
}

export async function scrapeReformation(
  page: any,
  params: ReformationSearchParams
): Promise<ReformationItem[]> {
  const { query, size, topN } = params;
  
  try {
    // Navigate to Reformation search
    const searchUrl = `https://www.thereformation.com/search?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl);
    await page.waitForLoadState('networkidle');
    
    // Try to apply "Best Sellers" or "Best Selling" sorting
    try {
      // Look for sort dropdown
      const sortActions = await page.observe("open the sort dropdown");
      if (sortActions && sortActions.length > 0) {
        await page.act(sortActions[0]);
        
        // Try to select "Best Sellers" or "Best Selling"
        try {
          await page.act("choose Best Sellers");
        } catch {
          try {
            await page.act("choose Best Selling");
          } catch {
            console.log('Could not apply sorting, using default results');
          }
        }
      }
    } catch (e) {
      console.log('Could not find sort dropdown for Reformation');
    }
    
    // Wait for results to load
    await page.waitForTimeout(2000);
    
    // Extract product data
    const { items } = await page.extract({
      instruction: "Extract product cards with name, price, url, and image from the search results.",
      schema: z.object({
        items: z.array(z.object({
          name: z.string(),
          price: z.union([z.string(), z.number()]),
          url: z.string().url(),
          imageUrl: z.string().url().optional()
        }))
      })
    });
    
    // Normalize and filter items
    const top = items
      .map(i => ({ 
        ...i, 
        price: typeof i.price === 'string' 
          ? Number(i.price.replace(/[^\d.]/g,'')) 
          : i.price 
      }))
      .filter(i => Number.isFinite(i.price))
      .slice(0, topN);
    
    return top;
    
  } catch (error) {
    console.error('Error scraping Reformation:', error);
    throw error;
  }
}
