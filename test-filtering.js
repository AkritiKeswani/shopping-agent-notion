// Test script to verify filtering logic
const { StagehandScraper } = require('./src/lib/stagehand-scraper');

async function testFiltering() {
  console.log('🧪 Testing filtering logic...');
  
  const scraper = new StagehandScraper();
  
  // Test with different filter combinations
  const testCases = [
    {
      name: 'All brands, no filters',
      filters: {}
    },
    {
      name: 'Only Aritzia',
      filters: { brands: ['aritzia'] }
    },
    {
      name: 'Only dresses under $100',
      filters: { 
        clothingType: 'dress', 
        maxPrice: 100,
        brands: ['reformation', 'free-people']
      }
    },
    {
      name: 'Size M tops',
      filters: { 
        clothingType: 'top', 
        size: 'M',
        brands: ['aritzia']
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    console.log('Filters:', testCase.filters);
    
    try {
      const result = await scraper.scrapeAllBrands(testCase.filters);
      console.log(`✅ Found ${result.deals.length} deals`);
      console.log(`❌ Errors: ${result.errors.length}`);
      
      if (result.deals.length > 0) {
        console.log('Sample deal:', result.deals[0]);
      }
    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
    }
  }
  
  await scraper.cleanup();
  console.log('\n✅ Filtering tests completed');
}

testFiltering().catch(console.error);
