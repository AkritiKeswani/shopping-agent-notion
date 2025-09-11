# Shopping Agent with Notion Integration

A Next.js application that uses Cursor's Background Agents API to scrape deals from Aritzia, Reformation, and Free People, then saves them to a Notion database.

## Features

- 🔍 **Smart Deal Scraping**: Uses Background Agents API to scrape deals from multiple fashion retailers
- 🎯 **Advanced Filtering**: Filter by clothing type, size, price range, and discount percentage
- 📝 **Notion Integration**: Save discovered deals directly to your Notion database
- 🎨 **Modern UI**: Built with Next.js, TypeScript, and Tailwind CSS
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices

## Supported Brands

- **Aritzia**: Canadian fashion retailer with contemporary styles
- **Reformation**: Sustainable fashion brand
- **Free People**: Bohemian and vintage-inspired clothing

## Setup Instructions

### 1. Environment Variables

Copy `.env.local` and fill in your API keys:

```bash
# Cursor Background Agents API Key (already configured)
CURSOR_BACKGROUND_AGENTS_API_KEY=key_5f8ffe692dd78b2b84788b3568cc3952b23f2088214285b30f4670777ed5bc62

# Browserbase API Key (get from https://browserbase.com)
BROWSERBASE_API_KEY=your_browserbase_api_key_here

# Notion API Key (get from https://developers.notion.com)
NOTION_API_KEY=your_notion_api_key_here

# Notion Database ID (create a database in Notion and get the ID)
NOTION_DATABASE_ID=your_notion_database_id_here

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Notion Database Setup

Create a new database in Notion with the following properties:

- **Title** (Title): Product name
- **Brand** (Select): Aritzia, Reformation, Free People
- **Original Price** (Number): Original price
- **Sale Price** (Number): Sale price
- **Discount %** (Number): Discount percentage
- **Size** (Rich Text): Available sizes
- **Clothing Type** (Select): jeans, shirt, dress, top, bottom, outerwear, accessories
- **Image URL** (URL): Product image
- **Product URL** (URL): Link to product page
- **In Stock** (Checkbox): Stock status
- **Scraped At** (Date): When the deal was found

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Search for Deals**: Use the search form to specify:
   - Clothing type (jeans, shirts, dresses, etc.)
   - Size preference
   - Maximum price
   - Minimum discount percentage
   - Brands to search

2. **View Results**: Browse through the discovered deals with:
   - Product images
   - Brand information
   - Price comparison
   - Discount percentages
   - Stock status

3. **Save to Notion**: Click "Save to Notion" to add all found deals to your database

## API Endpoints

- `POST /api/scrape` - Scrape deals from all brands
- `POST /api/notion` - Save deals to Notion database
- `GET /api/notion` - Retrieve saved deals from Notion

## Architecture

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Scraping**: Cursor Background Agents API with Browserbase
- **Database**: Notion API
- **State Management**: React hooks

## Troubleshooting

### Common Issues

1. **Background Agents API Errors**: Ensure your API key is valid and has sufficient credits
2. **Notion Integration Issues**: Check that your Notion API key has access to the database
3. **Scraping Timeouts**: The scraping process can take 2-5 minutes depending on the websites

### Getting Help

- Check the browser console for detailed error messages
- Verify all environment variables are set correctly
- Ensure your Notion database has the correct property structure

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License