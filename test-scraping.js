const { StagehandScraper } = require('./src/lib/stagehand-scraper.ts');

async function testScraping() {
  console.log('🚀 Starting scraping test...');
  
  const scraper = new StagehandScraper();
  
  try {
    await scraper.initialize();
    console.log('✅ Stagehand initialized');
    
    // Test with simple filters
    const filters = {
      clothingType: 'dress',
      size: '',
      maxPrice: 200,
      brands: ['aritzia', 'reformation']
    };
    
    console.log('🔍 Scraping with filters:', filters);
    const result = await scraper.scrapeAllBrands(filters);
    
    console.log('📊 Results:');
    console.log(`Found ${result.totalFound} deals`);
    console.log('Errors:', result.errors);
    
    if (result.deals.length > 0) {
      console.log('🎉 Sample deals:');
      result.deals.slice(0, 3).forEach((deal, i) => {
        console.log(`${i + 1}. ${deal.title} - $${deal.salePrice} (${deal.brand})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await scraper.cleanup();
    console.log('🧹 Cleanup complete');
  }
}

testScraping();
