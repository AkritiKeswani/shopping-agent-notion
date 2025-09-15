#!/usr/bin/env node

const { chromium } = require('playwright');
const { Stagehand } = require('@browserbasehq/stagehand');
const { Browserbase } = require('@browserbasehq/sdk');
const { Client } = require('@notionhq/client');

// Initialize clients
const browserbase = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY,
});

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Simple tool functions
async function searchAndExtract({ brand, query, size, monthISO, topN = 6 }) {
  try {
    // Create Browserbase session
    const session = await browserbase.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID,
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
    const siteConfigs = {
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
    
    const siteConfig = siteConfigs[brand];
    if (!siteConfig) {
      throw new Error(`Unsupported brand: ${brand}`);
    }
    
    // Navigate to search page
    const searchUrl = `${siteConfig.baseUrl}${siteConfig.searchPath}?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl);
    await page.waitForLoadState('networkidle');
    
    // Try to apply best sellers/top rated sorting
    try {
      const sortActions = await page.observe("open the sort dropdown");
      if (sortActions && sortActions.length > 0) {
        await page.act(sortActions[0]);
        
        for (const sortOption of siteConfig.sortOptions) {
          try {
            await page.act(`choose ${sortOption}`);
            break;
          } catch (e) {
            continue;
          }
        }
      }
    } catch (e) {
      console.log(`Could not apply sorting for ${brand}, using default results`);
    }
    
    await page.waitForTimeout(2000);
    
    // Extract product data (simplified for now)
    const items = [
      {
        name: `${brand} ${query} Item 1`,
        price: Math.floor(Math.random() * 200) + 50,
        url: `${siteConfig.baseUrl}/product-1`,
        imageUrl: 'https://via.placeholder.com/300x400'
      },
      {
        name: `${brand} ${query} Item 2`,
        price: Math.floor(Math.random() * 200) + 50,
        url: `${siteConfig.baseUrl}/product-2`,
        imageUrl: 'https://via.placeholder.com/300x400'
      }
    ].slice(0, topN);
    
    const rows = items.map(i => ({
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

async function writeNotion({ items }) {
  try {
    const databaseId = process.env.NOTION_DATABASE_ID;
    const results = [];
    
    for (const item of items) {
      try {
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
      } catch (error) {
        console.error(`Error creating item ${item.url}:`, error);
        results.push({ action: 'error', url: item.url, error: error.message });
      }
    }
    
    return { results, totalProcessed: items.length };
    
  } catch (error) {
    console.error('Error in writeNotion:', error);
    throw error;
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node simple-server.js <tool> <json-args>');
  process.exit(1);
}

const tool = args[0];
const toolArgs = JSON.parse(args[1]);

async function main() {
  try {
    let result;
    
    switch (tool) {
      case 'search_and_extract':
        result = await searchAndExtract(toolArgs);
        break;
      case 'write_notion':
        result = await writeNotion(toolArgs);
        break;
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
    
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}

main();

