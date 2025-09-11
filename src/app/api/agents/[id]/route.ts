import { NextRequest, NextResponse } from 'next/server';
import { BackgroundAgentsService } from '@/lib/background-agents';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const backgroundAgents = new BackgroundAgentsService();
    const agent = await backgroundAgents.getAgent(params.id);
    
    return NextResponse.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    console.error('Get agent error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch agent' 
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const backgroundAgents = new BackgroundAgentsService();
    await backgroundAgents.addFollowUpPrompt(params.id, prompt);
    
    return NextResponse.json({
      success: true,
      message: 'Follow-up prompt added successfully',
    });
  } catch (error) {
    console.error('Add follow-up prompt error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add follow-up prompt' 
      },
      { status: 500 }
    );
  }
}
