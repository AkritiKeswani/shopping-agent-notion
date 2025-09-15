# Environment Setup

To use the Browserbase MCP + Stagehand integration, you need to set up the following environment variables in your `.env.local` file:

## Required Environment Variables

```bash
# Browserbase Configuration
BROWSERBASE_API_KEY=your_browserbase_api_key_here
BROWSERBASE_PROJECT_ID=your_browserbase_project_id_here

# OpenAI Configuration (for Stagehand AI)
OPENAI_API_KEY=your_openai_api_key_here
```

## How to Get These Keys

### 1. Browserbase API Key & Project ID
1. Go to [Browserbase](https://browserbase.com)
2. Sign up/Login to your account
3. Create a new project
4. Get your API key and Project ID from the dashboard

### 2. OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up/Login to your account
3. Go to API Keys section
4. Create a new API key

## Setup Steps

1. Copy `.env.example` to `.env.local` (if it exists)
2. Add the environment variables above to `.env.local`
3. Restart your development server: `npm run dev`

## What Happens Without These Keys

- The app will show "Missing API keys" error messages
- No actual scraping will occur
- The interface will display 0 items found for all brands
- You'll see red error messages in the brand cards

## Testing

Once you have the environment variables set up, you can test the integration by running:

```bash
node test-stagehand-integration.js
```

This will test the Browserbase MCP + Stagehand scraper with sample filters.
