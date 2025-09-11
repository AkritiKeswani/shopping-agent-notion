import { NextRequest, NextResponse } from 'next/server';
import { ShoppingScraper } from '@/lib/scraper';
import { BackgroundAgentsService } from '@/lib/background-agents';
import { SearchFilters } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters: SearchFilters = body.filters || {};
    const userPreferences = body.userPreferences || '';

    const scraper = new ShoppingScraper();
    
    try {
      console.log('🚀 Starting scraping with Background Agents integration...');
      
      // Scrape and optimize deals
      const result = await scraper.scrapeAllBrands(filters, userPreferences);
      
      // If we found deals, trigger Background Agents to update the repo
      if (result.deals.length > 0) {
        console.log('🤖 Triggering Background Agents to update repository...');
        
        try {
          const backgroundAgents = new BackgroundAgentsService();
          
          // Create a deals updater agent to work on the repo
          const agent = await backgroundAgents.createDealsUpdaterAgent(
            'https://github.com/AkritiKeswani/shopping-agent-notion'
          );
          
          console.log(`✅ Background Agent created: ${agent.id}`);
          
          // Add a follow-up prompt with the new deals data
          const dealsSummary = result.deals.map(deal => 
            `- ${deal.title} (${deal.brand}) - $${deal.salePrice}`
          ).join('\n');
          
          await backgroundAgents.addFollowUpPrompt(agent.id, 
            `New deals found! Please update the repository with these ${result.deals.length} deals:\n\n${dealsSummary}\n\nUpdate the README.md and create a deals-summary.md file.`
          );
          
          console.log('📝 Background Agent prompt added successfully');
          
        } catch (agentError) {
          console.error('Background Agent error:', agentError);
          // Don't fail the whole request if agents fail
        }
      }
      
      return NextResponse.json({
        success: true,
        data: result,
        backgroundAgentTriggered: result.deals.length > 0,
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
