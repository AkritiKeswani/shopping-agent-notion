import { NextRequest, NextResponse } from 'next/server';
import { BrowserbaseMCPScraper } from '@/lib/browserbase-mcp-scraper';
import { SearchFilters } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters: SearchFilters = body.filters || {};
    console.log('🚀 Starting Browserbase MCP scraping with filters:', filters);

    const scraper = new BrowserbaseMCPScraper();
    
    // Use Browserbase MCP for web scraping
    const result = await scraper.scrapeAllBrands(filters);
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Browserbase MCP scraping API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to scrape deals from websites' 
      },
      { status: 500 }
    );
  }
}
