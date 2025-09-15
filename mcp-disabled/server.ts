#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { chromium } from 'playwright';
import { Stagehand } from '@browserbasehq/stagehand';
import { browserbase } from './lib/browserbase.js';
import { notion } from './lib/notion.js';

// MCP Server setup
const server = new Server(
  {
    name: 'shopping-agent-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool schemas
const SearchAndExtractSchema = z.object({
  brand: z.string(),
  query: z.string(),
  size: z.string(),
  monthISO: z.string(),
  topN: z.number().default(6),
});

const WriteNotionSchema = z.object({
  items: z.array(z.object({
    name: z.string(),
    brand: z.string(),
    price: z.number(),
    sizes: z.array(z.string()).default([]),
    wantedSize: z.string(),
    url: z.string(),
    imageUrl: z.string().optional(),
    sessionLink: z.string(),
    monthISO: z.string(),
  })),
});

const BudgetSummarySchema = z.object({
  monthISO: z.string(),
  cap: z.number(),
});

// Site-specific scrapers
const siteScrapers = {
  'Aritzia': {
    baseUrl: 'https://www.aritzia.com',
    searchPath: '/us/en/search',
    sortOptions: ['Best Sellers', 'Top Rated'],
  },
  'Free People': {
    baseUrl: 'https://www.freepeople.com',
    searchPath: '/search',
    sortOptions: ['Best Selling', 'Top Rated'],
  },
  'Reformation': {
    baseUrl: 'https://www.thereformation.com',
    searchPath: '/search',
    sortOptions: ['Best Sellers', 'Best Selling'],
  },
};

// Search and extract tool
async function searchAndExtract(params: z.infer<typeof SearchAndExtractSchema>) {
  const { brand, query, size, monthISO, topN } = params;
  
  try {
    // Create Browserbase session
    const session = await browserbase.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
      keepAlive: true,
      userMetadata: { brand, query, size, runId: Date.now().toString() }
    });
    
    const sessionLink = `https://browserbase.com/sessions/${session.id}`;
    
    // Connect via CDP
    const browser = await chromium.connectOverCDP(session.connectUrl);
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Initialize Stagehand
    const stagehand = new Stagehand(page);
    await stagehand.init();
    
    // Get site config
    const siteConfig = siteScrapers[brand as keyof typeof siteScrapers];
    if (!siteConfig) {
      throw new Error(`Unsupported brand: ${brand}`);
    }
    
    // Navigate to search page
    const searchUrl = `${siteConfig.baseUrl}${siteConfig.searchPath}?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl);
    await page.waitForLoadState('networkidle');
    
    // Try to apply best sellers/top rated sorting
    try {
      // Look for sort dropdown
      const sortActions = await page.observe("open the sort dropdown");
      if (sortActions && sortActions.length > 0) {
        await page.act(sortActions[0]);
        
        // Try to select best selling option
        for (const sortOption of siteConfig.sortOptions) {
          try {
            await page.act(`choose ${sortOption}`);
            break;
          } catch (e) {
            // Try next option
            continue;
          }
        }
      }
    } catch (e) {
      console.log(`Could not apply sorting for ${brand}, using default results`);
    }
    
    // Wait for results to load
    await page.waitForTimeout(2000);
    
    // Extract product data
    const { items } = await stagehand.page.extract({
      instruction: "Extract product cards with name, price, url, and image.",
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
    
    // Format for Notion
    const rows = top.map(i => ({
      name: i.name,
      brand,
      price: i.price,
      sizes: [],
      wantedSize: size,
      url: i.url,
      imageUrl: i.imageUrl,
      sessionLink,
      monthISO
    }));
    
    await browser.close();
    
    return {
      items: rows,
      sessionId: session.id,
      sessionLink
    };
    
  } catch (error) {
    console.error(`Error in searchAndExtract for ${brand}:`, error);
    throw error;
  }
}

// Write to Notion tool
async function writeNotion(params: z.infer<typeof WriteNotionSchema>) {
  const { items } = params;
  
  try {
    const databaseId = process.env.NOTION_DATABASE_ID!;
    const results = [];
    
    for (const item of items) {
      try {
        // Check if item already exists by URL
        const existing = await notion.databases.query({
          database_id: databaseId,
          filter: {
            property: 'URL',
            url: {
              equals: item.url
            }
          }
        });
        
        if (existing.results.length > 0) {
          // Update existing item
          const pageId = existing.results[0].id;
          await notion.pages.update({
            page_id: pageId,
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
          results.push({ action: 'updated', url: item.url });
        } else {
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
          results.push({ action: 'created', url: item.url });
        }
      } catch (error) {
        console.error(`Error upserting item ${item.url}:`, error);
        results.push({ action: 'error', url: item.url, error: error.message });
      }
    }
    
    return { results, totalProcessed: items.length };
    
  } catch (error) {
    console.error('Error in writeNotion:', error);
    throw error;
  }
}

// Budget summary tool
async function budgetSummary(params: z.infer<typeof BudgetSummarySchema>) {
  const { monthISO, cap } = params;
  
  try {
    const databaseId = process.env.NOTION_DATABASE_ID!;
    
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
    console.error('Error in budgetSummary:', error);
    throw error;
  }
}

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_and_extract',
        description: 'Search and extract top N best-selling items from a brand website',
        inputSchema: {
          type: 'object',
          properties: {
            brand: { type: 'string', description: 'Brand name (Aritzia, Free People, Reformation)' },
            query: { type: 'string', description: 'Search query' },
            size: { type: 'string', description: 'Desired size' },
            monthISO: { type: 'string', description: 'Month in ISO format (YYYY-MM-DD)' },
            topN: { type: 'number', description: 'Number of top items to extract', default: 6 }
          },
          required: ['brand', 'query', 'size', 'monthISO']
        }
      },
      {
        name: 'write_notion',
        description: 'Write items to Notion Wardrobe database',
        inputSchema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  brand: { type: 'string' },
                  price: { type: 'number' },
                  sizes: { type: 'array', items: { type: 'string' } },
                  wantedSize: { type: 'string' },
                  url: { type: 'string' },
                  imageUrl: { type: 'string' },
                  sessionLink: { type: 'string' },
                  monthISO: { type: 'string' }
                }
              }
            }
          },
          required: ['items']
        }
      },
      {
        name: 'budget_summary',
        description: 'Get budget summary for selected items in a month',
        inputSchema: {
          type: 'object',
          properties: {
            monthISO: { type: 'string', description: 'Month in ISO format (YYYY-MM-DD)' },
            cap: { type: 'number', description: 'Budget cap' }
          },
          required: ['monthISO', 'cap']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'search_and_extract': {
        const params = SearchAndExtractSchema.parse(args);
        const result = await searchAndExtract(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }
      
      case 'write_notion': {
        const params = WriteNotionSchema.parse(args);
        const result = await writeNotion(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }
      
      case 'budget_summary': {
        const params = BudgetSummarySchema.parse(args);
        const result = await budgetSummary(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Shopping Agent MCP server running on stdio');
}

main().catch(console.error);
