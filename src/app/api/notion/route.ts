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
      'Session URL': null, // Set to null instead of empty string
      Selected: false,
      Month: new Date().toLocaleString('default', { month: 'long' }),
    }));

    // Create pages in Notion database
    const promises = notionDeals.map(deal => 
      notion.pages.create({
        parent: { database_id: process.env.NOTION_DATABASE_ID! },
        properties: {
          Name: { title: [{ text: { content: deal.Name } }] },
          Brand: { select: { name: deal.Brand } },
          Price: { number: deal.Price },
          Sizes: { rich_text: [{ text: { content: deal.Sizes } }] },
          'Wanted Size': { rich_text: [{ text: { content: deal['Wanted Size'] } }] },
          URL: { url: deal.URL },
          'Image URL': { url: deal['Image URL'] },
          'Session URL': deal['Session URL'] ? { url: deal['Session URL'] } : { url: null },
          Selected: { checkbox: deal.Selected },
          Month: { select: { name: deal.Month } },
        },
      })
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

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

export async function GET() {
  try {
    if (!process.env.NOTION_DATABASE_ID) {
      return NextResponse.json(
        { success: false, error: 'Notion database ID not configured' },
        { status: 500 }
      );
    }

    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
    });

      const deals = response.results.map((page: any) => {
        const props = page.properties;
        return {
          id: page.id,
          title: props.Name?.title?.[0]?.text?.content || '',
          brand: props.Brand?.select?.name || '',
          price: props.Price?.number || 0,
          sizes: props.Sizes?.rich_text?.[0]?.text?.content || '',
          wantedSize: props['Wanted Size']?.rich_text?.[0]?.text?.content || '',
          url: props.URL?.url || '',
          imageUrl: props['Image URL']?.url || '',
          sessionUrl: props['Session URL']?.url || '',
          selected: props.Selected?.checkbox || false,
          month: props.Month?.select?.name || '',
        };
      });

    return NextResponse.json({
      success: true,
      data: deals,
    });

  } catch (error) {
    console.error('Notion GET API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch deals from Notion' 
      },
      { status: 500 }
    );
  }
}
