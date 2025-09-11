import { NextRequest, NextResponse } from 'next/server';
import { BackgroundAgentsService } from '@/lib/background-agents';
import { SearchFilters } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters: SearchFilters = body.filters || {};
    console.log('🚀 Starting Background Agent scraping with filters:', filters);

    const backgroundAgents = new BackgroundAgentsService();
    
    // Use Background Agents to scrape and save to Notion
    const deals = await backgroundAgents.scrapeAndSaveToNotion(filters);
    
    return NextResponse.json({
      success: true,
      data: {
        deals: deals,
        totalFound: deals.length,
        errors: [],
      },
    });
  } catch (error) {
    console.error('Background Agent API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to scrape deals with Background Agents' 
      },
      { status: 500 }
    );
  }
}
