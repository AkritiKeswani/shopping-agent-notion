// Simple test to check API
const testAPI = async () => {
  try {
    console.log('Testing API...');
    
    const response = await fetch('http://localhost:3000/api/shop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'tops',
        size: 'M',
        brands: ['Aritzia'],
        cap: 2000
      })
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.perBrand && data.perBrand[0] && data.perBrand[0].error) {
      console.log('❌ Error found:', data.perBrand[0].error);
    } else {
      console.log('✅ API working, found', data.allItems?.length || 0, 'items');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testAPI();
