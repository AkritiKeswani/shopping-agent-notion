import { NextRequest, NextResponse } from 'next/server';
import { BackgroundAgentsService } from '@/lib/background-agents';
import { SearchFilters } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters: SearchFilters = body.filters || {};
    const userPreferences = body.userPreferences || '';

    console.log('🤖 Creating Background Agent for shopping search...');

    const backgroundAgents = new BackgroundAgentsService();
    
    // Create a comprehensive shopping agent that does everything
    const agent = await backgroundAgents.createAgent({
      name: `Shopping Search - ${filters.clothingType || 'All Items'} - ${new Date().toLocaleDateString()}`,
      repository: 'https://github.com/AkritiKeswani/shopping-agent-notion',
      prompt: `You are an intelligent shopping agent. Your task is to:

1. **Scrape and Analyze Deals:**
   - Visit Aritzia, Reformation, and Free People sale pages
   - Find clothing items matching these criteria:
     - Type: ${filters.clothingType || 'any'}
     - Size: ${filters.size || 'any'} 
     - Max Price: $${filters.maxPrice || 'no limit'}
     - Brands: ${filters.brands?.join(', ') || 'all'}
   - Use AI to select only the BEST 5-8 deals based on value, style, and quality

2. **Save to Notion Database:**
   - Add the optimal deals to the Notion database (ID: 2688d66d582880108de6da8c4c016588)
   - Use these property names: Name, Brand, Price, Sizes, Wanted Size, URL, Image URL, Session URL, Selected, Month
   - Set Month to current month
   - Set Selected to false initially

3. **Update Repository Documentation:**
   - Update README.md with a summary of the latest deals found
   - Create/update deals-summary.md with detailed information
   - Include reasoning for why each deal was selected
   - Add any insights about current fashion trends or pricing

4. **Provide User Feedback:**
   - Create a summary of what was found and why these are the best options
   - Include any recommendations or insights

${userPreferences ? `Additional User Preferences: ${userPreferences}` : ''}

Use your AI capabilities to make intelligent decisions about which deals are truly worth the user's time and money. Focus on quality, value, and style match.`
    });

    console.log(`✅ Background Agent created: ${agent.id}`);
    console.log(`🔗 Agent Status: ${agent.status}`);

    return NextResponse.json({
      success: true,
      message: 'Background Agent created successfully! It will now work on finding the best deals for you.',
      data: {
        agentId: agent.id,
        agentName: agent.name,
        status: agent.status,
        repository: agent.repository,
        estimatedTime: '2-5 minutes',
        whatItWillDo: [
          'Scrape Aritzia, Reformation, and Free People',
          'Use AI to find the best deals',
          'Save optimal deals to your Notion database',
          'Update your GitHub repo with deal summaries',
          'Create documentation with insights'
        ]
      }
    });

  } catch (error) {
    console.error('Background Agent creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create Background Agent' 
      },
      { status: 500 }
    );
  }
}
