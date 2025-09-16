import { NextRequest, NextResponse } from 'next/server';
import { CustomScrapers } from '@/lib/custom-scrapers';
import { ShopRequest, ShopResponse } from '@/core/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: ShopRequest = await request.json();
    const { query, size, brands, cap } = body;
    const monthISO = new Date().toISOString().split('T')[0]; // Use current date

    console.log('🚀 Starting Browserbase MCP shopping search:', { query, size, brands, monthISO, cap });

    // Convert brand names to match our scraper's expected format
    const brandMapping: { [key: string]: string } = {
      'Aritzia': 'aritzia',
      'Reformation': 'reformation'
    };

    const mappedBrands = brands.map(brand => brandMapping[brand] || brand.toLowerCase());
    
    // Create search filters for the scraper
    const filters = {
      brands: mappedBrands,
      clothingType: query,
      size: size,
      maxPrice: cap
    };

    console.log('🔍 Using Browserbase MCP + Stagehand to scrape deals...');
    
    // Check if environment variables are set
    if (!process.env.BROWSERBASE_API_KEY || !process.env.BROWSERBASE_PROJECT_ID || !process.env.OPENAI_API_KEY) {
      console.log('⚠️ Missing environment variables - returning empty results');
      return NextResponse.json({
        perBrand: brands.map(brand => ({
          brand,
          count: 0,
          sessionId: '',
          sessionLink: '',
          error: 'Missing API keys - please configure BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID, and OPENAI_API_KEY'
        })),
        totals: { upserts: 0 },
        budget: { cap, selectedSpend: 0, remaining: cap }
      });
    }
    
    const scraper = new CustomScrapers();
    const result = await scraper.scrapeAllBrands(filters);

    console.log(`✅ Scraping completed: ${result.deals.length} deals found`);

    // Convert deals to the expected format and filter by budget
    const allDeals = result.deals.map(deal => ({
      name: deal.title,
      brand: deal.brand,
      price: deal.salePrice,
      sizes: [deal.size],
      wantedSize: size,
      url: deal.productUrl,
      imageUrl: deal.imageUrl,
      sessionLink: `https://browserbase.com/sessions/scraped-${Date.now()}`,
      monthISO: monthISO
    }));

    // Filter out $0 items FIRST, then apply budget cap
    const validItems = allDeals.filter(item => item.price > 0); // Remove $0 items
    const allItems = validItems.filter(item => item.price <= cap); // Then apply budget
    const filteredOut = allDeals.length - allItems.length;
    
    console.log(`📊 Budget filtering: ${allDeals.length} total items found, ${filteredOut} items over $${cap} budget, ${allItems.length} items within budget`);
    
    // Only show items within budget - no fallback
    let finalItems = allItems;
    
    // Group by brand and ensure fair representation
    const brandGroups: { [key: string]: any[] } = {};
    finalItems.forEach(item => {
      if (!brandGroups[item.brand]) {
        brandGroups[item.brand] = [];
      }
      brandGroups[item.brand].push(item);
    });
    
    // Sort each brand's items by price, then interleave them for fair representation
    Object.keys(brandGroups).forEach(brand => {
      brandGroups[brand].sort((a, b) => a.price - b.price);
    });
    
    // Interleave items from different brands for fair representation
    const interleavedItems: any[] = [];
    const maxItemsPerBrand = Math.max(...Object.values(brandGroups).map(items => items.length));
    
    for (let i = 0; i < maxItemsPerBrand; i++) {
      Object.values(brandGroups).forEach(brandItems => {
        if (brandItems[i]) {
          interleavedItems.push(brandItems[i]);
        }
      });
    }
    
    finalItems = interleavedItems;

    // ENFORCE BUDGET: Only include items that fit within budget
    const budgetedItems: any[] = [];
    let totalSpend = 0;
    for (const item of finalItems) {
      if (totalSpend + item.price <= cap) {
        budgetedItems.push(item);
        totalSpend += item.price;
      }
    }
    finalItems = budgetedItems;

    // Calculate budget summary (after strict budget enforcement)
    const budget = {
      cap,
      selectedSpend: totalSpend,
      remaining: Math.max(0, cap - totalSpend)
    };

    // Group results by brand
    const perBrand: any[] = [];
    const brandCounts: { [key: string]: number } = {};

    finalItems.forEach(item => {
      const originalBrand = brands.find(b => brandMapping[b] === item.brand) || item.brand;
      brandCounts[originalBrand] = (brandCounts[originalBrand] || 0) + 1;
    });

    brands.forEach(brand => {
      perBrand.push({
        brand,
        count: brandCounts[brand] || 0,
        sessionId: `scraped-${Date.now()}`,
        sessionLink: `https://browserbase.com/sessions/scraped-${Date.now()}`,
      });
    });

    console.log(`💰 Budget summary: $${budget.selectedSpend} spent, $${budget.remaining} remaining`);

    const response: ShopResponse = {
      perBrand,
      totals: { upserts: finalItems.length }, // Count of items ready to save
      budget,
      allItems: finalItems // Add the actual items to the response
    };

    console.log('🎉 Browserbase MCP shopping search completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Shop API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process shopping search with Browserbase MCP',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}