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
      Title: deal.title,
      Brand: deal.brand,
      'Original Price': deal.originalPrice,
      'Sale Price': deal.salePrice,
      Size: deal.size,
      'Clothing Type': deal.clothingType,
      'Image URL': deal.imageUrl,
      'Product URL': deal.productUrl,
      'In Stock': deal.inStock,
      'Scraped At': deal.scrapedAt.toISOString(),
    }));

    // Create pages in Notion database
    const promises = notionDeals.map(deal => 
      notion.pages.create({
        parent: { database_id: process.env.NOTION_DATABASE_ID! },
        properties: {
          Title: { title: [{ text: { content: deal.Title } }] },
          Brand: { select: { name: deal.Brand } },
          'Original Price': { number: deal['Original Price'] },
          'Sale Price': { number: deal['Sale Price'] },
          Size: { rich_text: [{ text: { content: deal.Size } }] },
          'Clothing Type': { select: { name: deal['Clothing Type'] } },
          'Image URL': { url: deal['Image URL'] },
          'Product URL': { url: deal['Product URL'] },
          'In Stock': { checkbox: deal['In Stock'] },
          'Scraped At': { date: { start: deal['Scraped At'] } },
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
          title: props.Title?.title?.[0]?.text?.content || '',
          brand: props.Brand?.select?.name || '',
          originalPrice: props['Original Price']?.number || 0,
          salePrice: props['Sale Price']?.number || 0,
          size: props.Size?.rich_text?.[0]?.text?.content || '',
          clothingType: props['Clothing Type']?.select?.name || '',
          imageUrl: props['Image URL']?.url || '',
          productUrl: props['Product URL']?.url || '',
          inStock: props['In Stock']?.checkbox || false,
          scrapedAt: props['Scraped At']?.date?.start || '',
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
