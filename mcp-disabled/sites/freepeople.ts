import { z } from 'zod';

export interface FreePeopleItem {
  name: string;
  price: number;
  url: string;
  imageUrl?: string;
}

export interface FreePeopleSearchParams {
  query: string;
  size: string;
  topN: number;
}

export async function scrapeFreePeople(
  page: any,
  params: FreePeopleSearchParams
): Promise<FreePeopleItem[]> {
  const { query, size, topN } = params;
  
  try {
    // Navigate to Free People search
    const searchUrl = `https://www.freepeople.com/search?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl);
    await page.waitForLoadState('networkidle');
    
    // Try to apply "Best Selling" or "Top Rated" sorting
    try {
      // Look for sort dropdown
      const sortActions = await page.observe("open the sort dropdown");
      if (sortActions && sortActions.length > 0) {
        await page.act(sortActions[0]);
        
        // Try to select "Best Selling" or "Top Rated"
        try {
          await page.act("choose Best Selling");
        } catch {
          try {
            await page.act("choose Top Rated");
          } catch {
            console.log('Could not apply sorting, using default results');
          }
        }
      }
    } catch (e) {
      console.log('Could not find sort dropdown for Free People');
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
    console.error('Error scraping Free People:', error);
    throw error;
  }
}
