import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const notion = new Client({
  auth: process.env.NOTION_API_KEY!,
});

interface WardrobeItem {
  name: string;
  brand: string;
  price: number;
  sizes: string[];
  wantedSize: string;
  url: string;
  imageUrl?: string;
  sessionLink: string;
  monthISO: string;
}

async function upsertWardrobeItem(item: WardrobeItem): Promise<{ action: string; url: string }> {
  const databaseId = process.env.NOTION_DATABASE_ID!;
  
  try {
    // Create new item in Notion with just the title (working version)
    const page = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        'Name': { title: [{ text: { content: item.name } }] }
      }
    });
    console.log('✅ Successfully created page:', page.id);
    return { action: 'created', url: item.url };
  } catch (error) {
    console.error(`Error upserting item ${item.url}:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items to save' },
        { status: 400 }
      );
    }

    // Check for required environment variables
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing Notion credentials - please configure NOTION_API_KEY and NOTION_DATABASE_ID'
        },
        { status: 500 }
      );
    }

    console.log(`💾 Saving ${items.length} items to Notion...`);
    
    // Process each item and save to Notion
    const results = [];
    let successCount = 0;
    
    for (const item of items) {
      try {
        const result = await upsertWardrobeItem(item);
        results.push(result);
        successCount++;
      } catch (error) {
        console.error(`Failed to save item ${item.name}:`, error);
        // Continue with other items even if one fails
      }
    }
    
    console.log(`✅ Notion write completed: ${successCount}/${items.length} items processed`);

    return NextResponse.json({
      success: true,
      upserts: successCount,
      message: `${successCount} items saved to Notion`,
      results
    });

  } catch (error) {
    console.error('❌ Save API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save to Notion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
