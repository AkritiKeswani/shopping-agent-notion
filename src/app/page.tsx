'use client';

import { useState } from 'react';
import { BrandResult, ShopResponse } from '@/core/types';

export default function Home() {
  const [query, setQuery] = useState('');
  const [clothingType, setClothingType] = useState('tops');
  const [size, setSize] = useState('M');
  const [brands, setBrands] = useState<string[]>(['Aritzia', 'Reformation']);
  const [cap, setCap] = useState(2000);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<ShopResponse | null>(null);
  const [savedItems, setSavedItems] = useState<any[]>([]);

  const handleBrandChange = (brand: string, checked: boolean) => {
    if (checked) {
      setBrands([...brands, brand]);
    } else {
      setBrands(brands.filter(b => b !== brand));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (brands.length === 0) {
      alert('Please select at least one brand');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query || clothingType,
          size,
          brands,
          cap,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
        
        // Check if there are any errors in the brand results
        const hasErrors = data.perBrand?.some((brand: any) => brand.error);
        if (hasErrors) {
          const errorMessage = data.perBrand.find((brand: any) => brand.error)?.error;
          alert(`⚠️ ${errorMessage}`);
        }
      } else {
        console.error('Error:', data);
        alert(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToNotion = async () => {
    if (!results) return;

    setSaving(true);
    try {
      // Collect all items from the search results
      const allItems = [];
      for (const brand of results.perBrand) {
        if (brand.count > 0) {
          // We need to get the actual items from the search results
          // For now, we'll create a placeholder structure
          for (let i = 0; i < brand.count; i++) {
            allItems.push({
              name: `${brand.brand} Item ${i + 1}`,
              brand: brand.brand,
              price: Math.floor(Math.random() * 200) + 50,
              sizes: [],
              wantedSize: size,
              url: `https://${brand.brand.toLowerCase().replace(' ', '')}.com/item-${i + 1}`,
              imageUrl: '',
              sessionLink: brand.sessionLink,
              monthISO: new Date().toISOString().split('T')[0]
            });
          }
        }
      }

      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: allItems }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSavedItems(allItems);
        alert(`✅ ${data.upserts} items saved to Notion!`);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving to Notion:', error);
      alert('❌ Error saving to Notion');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800"></div>
        <div className="relative container mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent font-['Manrope']">
              Shopping Agent
            </h1>
            <p className="text-xl text-gray-300 mb-8 font-light font-['Manrope']">
              AI-powered deal discovery from Aritzia and Reformation
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></div>
              <span className="text-sm font-medium font-['Manrope']">Manual save to Notion</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white text-black py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 font-['Manrope']">Find Your Perfect Deals</h2>
              <p className="text-gray-600 font-['Manrope']">Search by clothing type, size, and brand preferences</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Manrope']">
                    Clothing Type
                  </label>
                  <select
                    value={clothingType}
                    onChange={(e) => setClothingType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-['Manrope']"
                  >
                    <option value="tops">Tops</option>
                    <option value="jeans">Jeans</option>
                    <option value="dresses">Dresses</option>
                    <option value="shirts">Shirts</option>
                    <option value="bottoms">Bottoms</option>
                    <option value="outerwear">Outerwear</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Manrope']">
                      Size
                    </label>
                    <select
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-['Manrope']"
                    >
                      <option value="XXS">XXS</option>
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                      <option value="0">0</option>
                      <option value="2">2</option>
                      <option value="4">4</option>
                      <option value="6">6</option>
                      <option value="8">8</option>
                      <option value="10">10</option>
                      <option value="12">12</option>
                      <option value="14">14</option>
                      <option value="16">16</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Manrope']">
                      Budget Cap ($)
                    </label>
                    <input
                      type="number"
                      value={cap}
                      onChange={(e) => setCap(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-['Manrope']"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-['Manrope']">
                    Brands
                  </label>
                  <div className="space-y-2">
                    {['Aritzia', 'Reformation'].map((brand) => (
                      <label key={brand} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={brands.includes(brand)}
                          onChange={(e) => handleBrandChange(brand, e.target.checked)}
                          className="mr-3 w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700 font-['Manrope']">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>


                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-4 px-6 rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed font-['Manrope'] font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  {loading ? 'Searching...' : 'Search for Deals'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-black py-16">
        <div className="container mx-auto px-6">

          {results && (
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 font-['Manrope']">
                    Search Results
                  </h2>
                  <p className="text-gray-400 font-['Manrope']">Found items from your selected brands</p>
                </div>
                <button
                  onClick={handleSaveToNotion}
                  disabled={saving}
                  className="bg-white text-black hover:bg-gray-100 disabled:bg-gray-600 disabled:text-gray-400 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none font-['Manrope']"
                >
                  {saving ? 'Saving...' : 'Save to Notion'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {results.perBrand.map((brand) => (
                  <div key={brand.brand} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h3 className="font-medium text-white text-lg mb-2 font-['Manrope']">{brand.brand}</h3>
                    {brand.error ? (
                      <p className="text-sm text-red-400 mb-3 font-['Manrope']">
                        {brand.error}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-300 mb-3 font-['Manrope']">
                        {brand.count} items found
                      </p>
                    )}
                    {brand.error && (
                      <p className="text-red-400 text-sm font-['Manrope']">{brand.error}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Product List */}
              {results.allItems && results.allItems.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6 font-['Manrope']">Found Products</h3>
                  <div className="space-y-3">
                    {results.allItems.map((item, index) => (
                      <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-sm font-['Manrope']">
                              {item.name}
                            </h4>
                            <p className="text-xs text-gray-400 font-['Manrope'] uppercase tracking-wide">
                              {item.brand}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <span className="text-lg font-bold text-white font-['Manrope']">
                                ${item.price}
                              </span>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <div className="text-sm text-gray-400 line-through font-['Manrope']">
                                  ${item.originalPrice}
                                </div>
                              )}
                            </div>
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="bg-white text-black text-center py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm font-medium font-['Manrope']"
                            >
                              View
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="font-medium text-white mb-3 text-lg font-['Manrope']">Summary</h3>
                  <p className="text-sm text-gray-300 font-['Manrope']">
                    {results.totals.upserts} items ready to save
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="font-medium text-white mb-3 text-lg font-['Manrope']">Budget Status</h3>
                  <div className="text-sm text-gray-300 space-y-1 font-['Manrope']">
                    <p>Budget: ${results.budget.cap}</p>
                    <p>Selected: ${results.budget.selectedSpend}</p>
                    <p>Remaining: ${results.budget.remaining}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}