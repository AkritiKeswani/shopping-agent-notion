import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY!,
});

export interface WardrobeItem {
  name: string;
  brand: string;
  price: number;
  sizes: string[];
  wantedSize: string;
  url: string;
  imageUrl?: string;
  sessionLink: string;
  monthISO: string;
}

export interface BudgetSummary {
  cap: number;
  selectedSpend: number;
  remaining: number;
  selectedItems: number;
}

export async function upsertWardrobeItem(item: WardrobeItem): Promise<{ action: string; url: string }> {
  const databaseId = process.env.NOTION_DATABASE_ID!;
  
  try {
    // For now, skip duplicate checking and always create new items
    // TODO: Implement proper duplicate checking with Notion API
    const existing = { results: [] };
    
    // Always create new items for now
    {
      // Create new item
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          'Name': { title: [{ text: { content: item.name } }] },
          'Brand': { select: { name: item.brand } },
          'Price': { number: item.price },
          'Sizes': { multi_select: item.sizes.map(size => ({ name: size })) },
          'Wanted Size': { select: { name: item.wantedSize } },
          'URL': { url: item.url },
          'Image URL': { url: item.imageUrl || '' },
          'Session Link': { url: item.sessionLink },
          'Selected': { checkbox: false },
          'Month': { date: { start: item.monthISO } }
        }
      });
      return { action: 'created', url: item.url };
    }
  } catch (error) {
    console.error(`Error upserting item ${item.url}:`, error);
    throw error;
  }
}

export async function getBudgetSummary(monthISO: string, cap: number): Promise<BudgetSummary> {
  const databaseId = process.env.NOTION_DATABASE_ID!;
  
  try {
    // Query selected items for the month
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        and: [
          {
            property: 'Selected',
            checkbox: {
              equals: true
            }
          },
          {
            property: 'Month',
            date: {
              equals: monthISO
            }
          }
        ]
      }
    });
    
    const selectedSpend = response.results.reduce((sum, page: any) => {
      const price = page.properties.Price?.number || 0;
      return sum + price;
    }, 0);
    
    const remaining = cap - selectedSpend;
    
    return {
      cap,
      selectedSpend,
      remaining,
      selectedItems: response.results.length
    };
  } catch (error) {
    console.error('Error getting budget summary:', error);
    throw error;
  }
}

export { notion };
