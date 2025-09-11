import { NextRequest, NextResponse } from 'next/server';
import { notion } from '@/lib/notion';
import { Deal, NotionDeal } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const deals: Deal[] = body.deals || [];

    if (!process.env.NOTION_DATABASE_ID) {
      return NextResponse.json(
        { success: false, error: 'Notion database ID not configured' },
        { status: 500 }
      );
    }

    const notionDeals: NotionDeal[] = deals.map(deal => ({
      Name: deal.title,
      Brand: deal.brand,
      Price: deal.salePrice,
      Sizes: deal.size,
      'Wanted Size': '', // Will be filled by user selection
      URL: deal.productUrl,
      'Image URL': deal.imageUrl,
      'Session URL': '', // Set to empty string
      Selected: false,
      Month: new Date().toLocaleString('default', { month: 'long' }),
    }));

    console.log('📝 Attempting to save deals to Notion:', notionDeals);

    // Create pages in Notion database with all properties
    const promises = notionDeals.map(deal => 
      notion.pages.create({
        parent: { database_id: process.env.NOTION_DATABASE_ID! },
        properties: {
          Name: { title: [{ text: { content: deal.Name } }] },
          Brand: { rich_text: [{ text: { content: deal.Brand } }] },
          Price: { number: deal.Price },
          Sizes: { rich_text: [{ text: { content: deal.Sizes } }] },
          URL: { url: deal.URL },
          'Image URL': { url: deal['Image URL'] },
          'session URL': { url: deal['Session URL'] || '' },
          Selected: { checkbox: false },
          Month: { date: { start: new Date().toISOString().split('T')[0] } },
        },
      })
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    // Log failed results for debugging
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Notion save failed for deal ${index}:`, result.reason);
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully added ${successful} deals to Notion. ${failed} failed.`,
      data: { successful, failed },
    });

  } catch (error) {
    console.error('Notion API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save deals to Notion' 
      },
      { status: 500 }
    );
  }
}

