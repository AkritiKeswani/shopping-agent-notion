import { z } from 'zod';

export interface AritziaItem {
  name: string;
  price: number;
  url: string;
  imageUrl?: string;
}

export interface AritziaSearchParams {
  query: string;
  size: string;
  topN: number;
}

export async function scrapeAritzia(
  page: any,
  params: AritziaSearchParams
): Promise<AritziaItem[]> {
  const { query, size, topN } = params;
  
  try {
    // Navigate to Aritzia search
    const searchUrl = `https://www.aritzia.com/us/en/search?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl);
    await page.waitForLoadState('networkidle');
    
    // Try to apply "Best Sellers" sorting
    try {
      // Look for sort dropdown
      const sortActions = await page.observe("open the sort dropdown");
      if (sortActions && sortActions.length > 0) {
        await page.act(sortActions[0]);
        
        // Try to select "Best Sellers" or "Top Rated"
        try {
          await page.act("choose Best Sellers");
        } catch {
          try {
            await page.act("choose Top Rated");
          } catch {
            console.log('Could not apply sorting, using default results');
          }
        }
      }
    } catch (e) {
      console.log('Could not find sort dropdown for Aritzia');
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
    console.error('Error scraping Aritzia:', error);
    throw error;
  }
}
