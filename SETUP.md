# Shopping Agent Setup Guide

This shopping agent searches Aritzia, Free People, and Reformation for best-selling items and saves them to a Notion database.

## Architecture

- **MCP Server** (`/mcp/server.ts`): Handles all web scraping and Notion operations
- **Next.js API** (`/api/shop`): Thin orchestrator that spawns MCP processes
- **Minimal UI**: Simple form for search parameters and results display

## Prerequisites

1. **Browserbase Account**: For web scraping sessions
2. **Notion Integration**: API key and database access
3. **Node.js**: Version 18+ with npm

## Environment Variables

Create a `.env.local` file in the project root:

```bash
# Browserbase Configuration
BROWSERBASE_API_KEY=your_browserbase_api_key
BROWSERBASE_PROJECT_ID=your_browserbase_project_id

# Notion Configuration
NOTION_API_KEY=your_notion_integration_token
NOTION_DATABASE_ID=your_wardrobe_database_id
```

## Notion Database Setup

Create a Notion database called "Wardrobe" with these exact properties:

| Property Name | Type | Description |
|---------------|------|-------------|
| Name | Title | Product name |
| Brand | Select | Aritzia, Free People, Reformation |
| Price | Number | Product price |
| Sizes | Multi-select | Available sizes |
| Wanted Size | Select | Desired size |
| URL | URL | Product URL |
| Image URL | URL | Product image |
| Session Link | URL | Browserbase session link |
| Selected | Checkbox | Whether item is selected |
| Month | Date | Month for budget tracking |

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install MCP dependencies:
```bash
cd mcp
npm install
cd ..
```

3. Install additional dependencies for MCP:
```bash
npm install @modelcontextprotocol/sdk playwright
```

## Usage

1. Start the development server:
```bash
npm run dev
```

2. Open http://localhost:3000

3. Fill out the search form:
   - Enter search query (e.g., "tops", "jeans")
   - Select desired size
   - Choose brands to search
   - Set budget cap
   - Select month for tracking

4. Click "Search & Save to Notion"

The system will:
- Create Browserbase sessions for each brand
- Search and extract top 6 best-selling items
- Apply site-specific sorting (Best Sellers/Top Rated)
- Save all items to your Notion database
- Display results with session links

## MCP Tools

The MCP server exposes three tools:

### `search_and_extract`
- Searches a brand website for products
- Applies best-selling sorting when available
- Extracts product data with price normalization
- Returns formatted items ready for Notion

### `write_notion`
- Upserts items to the Wardrobe database
- Handles duplicate detection by URL
- Updates existing items or creates new ones

### `budget_summary`
- Calculates budget status for selected items
- Returns spending vs. budget cap

## Site-Specific Features

### Aritzia
- Searches: `https://www.aritzia.com/us/en/search`
- Sorting: "Best Sellers" or "Top Rated"

### Free People
- Searches: `https://www.freepeople.com/search`
- Sorting: "Best Selling" or "Top Rated"

### Reformation
- Searches: `https://www.thereformation.com/search`
- Sorting: "Best Sellers" or "Best Selling"

## Troubleshooting

1. **MCP Connection Issues**: Ensure all dependencies are installed
2. **Browserbase Errors**: Check API key and project ID
3. **Notion Errors**: Verify database ID and integration permissions
4. **Scraping Failures**: Check if sites have changed their structure

## Development

To test the MCP server directly:
```bash
npx tsx scripts/run.ts
```

To run individual site scrapers:
```bash
npx tsx src/sites/aritzia.ts
```

## Notes

- The system uses Playwright with Stagehand for intelligent web scraping
- All heavy operations run in MCP processes to keep the UI responsive
- Session links allow you to view the actual scraping process in Browserbase
- Items are deduplicated by URL to prevent duplicates in Notion

