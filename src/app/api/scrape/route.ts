import { NextRequest, NextResponse } from 'next/server';
import { ShoppingScraper } from '@/lib/scraper';
import { SearchFilters } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters: SearchFilters = body.filters || {};
    const userPreferences = body.userPreferences || '';

    const scraper = new ShoppingScraper();
    
    try {
      console.log('🚀 Starting scraping...');
      
      // Scrape and optimize deals
      const result = await scraper.scrapeAllBrands(filters, userPreferences);
      
      return NextResponse.json({
        success: true,
        data: result,
      });
    } finally {
      // Cleanup is handled by SimpleScraper internally
    }
  } catch (error) {
    console.error('Scraping API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to scrape deals' 
      },
      { status: 500 }
    );
  }
}
