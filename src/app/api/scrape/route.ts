import { NextRequest, NextResponse } from 'next/server';
import { ShoppingScraper } from '@/lib/scraper';
import { SearchFilters } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters: SearchFilters = body.filters || {};

    const scraper = new ShoppingScraper();
    
    try {
      const result = await scraper.scrapeAllBrands(filters);
      
      return NextResponse.json({
        success: true,
        data: result,
      });
    } finally {
      await scraper.cleanup();
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
