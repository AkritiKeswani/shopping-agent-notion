import { NextRequest, NextResponse } from 'next/server';
import { BackgroundAgentsService } from '@/lib/background-agents';

export async function GET() {
  try {
    const backgroundAgents = new BackgroundAgentsService();
    const agents = await backgroundAgents.listAgents();
    
    return NextResponse.json({
      success: true,
      data: agents,
    });
  } catch (error) {
    console.error('Get agents error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch agents' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, repository, prompt, type } = body;

    if (!name || !repository || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Name, repository, and prompt are required' },
        { status: 400 }
      );
    }

    const backgroundAgents = new BackgroundAgentsService();
    
    let agent;
    if (type === 'deals-monitor') {
      agent = await backgroundAgents.createShoppingDealsAgent(repository);
    } else if (type === 'deals-updater') {
      agent = await backgroundAgents.createDealsUpdaterAgent(repository);
    } else {
      agent = await backgroundAgents.createAgent({ name, repository, prompt });
    }

    return NextResponse.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    console.error('Create agent error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create agent' 
      },
      { status: 500 }
    );
  }
}
