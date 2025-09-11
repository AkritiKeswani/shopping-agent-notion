'use client';

import { useState } from 'react';
import { SearchFilters, Deal } from '@/types';
import DealCard from '@/components/DealCard';
import SearchForm from '@/components/SearchForm';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notionStatus, setNotionStatus] = useState<string | null>(null);

  const handleSearch = async (filters: SearchFilters) => {
    setLoading(true);
    setError(null);
    setDeals([]);

    try {
      console.log('🔍 Starting search...');
      
      // Step 1: Scrape deals
      const scrapeResponse = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters }),
      });

      const scrapeData = await scrapeResponse.json();

      if (scrapeData.success) {
        console.log(`📊 Found ${scrapeData.data.deals.length} deals`);
        setDeals(scrapeData.data.deals);
        
        if (scrapeData.data.errors.length > 0) {
          setError(`Some errors occurred: ${scrapeData.data.errors.join(', ')}`);
        }

        // Step 2: Save to Notion if we have deals
        if (scrapeData.data.deals.length > 0) {
          console.log('💾 Saving to Notion...');
          setNotionStatus('Saving to Notion...');
          
          const notionResponse = await fetch('/api/notion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ deals: scrapeData.data.deals }),
          });

          const notionData = await notionResponse.json();
          
          if (notionData.success) {
            console.log(`✅ Saved ${notionData.data.successful} deals to Notion`);
            setNotionStatus(`✅ ${notionData.data.successful} deals saved to Notion`);
            // Update error message to show Notion success
            if (scrapeData.data.errors.length > 0) {
              setError(`Scraping errors: ${scrapeData.data.errors.join(', ')}. But ${notionData.data.successful} deals saved to Notion successfully.`);
            } else {
              setError(null); // Clear any previous errors
            }
          } else {
            setNotionStatus(`❌ Notion save failed: ${notionData.error}`);
            setError(`Scraping successful but Notion save failed: ${notionData.error}`);
          }
        } else {
          setNotionStatus('No deals to save to Notion');
        }
      } else {
        setError(scrapeData.error || 'Failed to fetch deals');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleManualNotionSave = async () => {
    if (deals.length === 0) return;

    setLoading(true);
    setNotionStatus('Saving to Notion...');
    
    try {
      const response = await fetch('/api/notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deals }),
      });

      const data = await response.json();
      
      if (data.success) {
        setNotionStatus(`✅ ${data.data.successful} deals saved to Notion`);
      } else {
        setNotionStatus(`❌ Notion save failed: ${data.error}`);
        setError(data.error || 'Failed to save to Notion');
      }
    } catch (err) {
      setNotionStatus('❌ Network error saving to Notion');
      setError('Failed to save to Notion');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800"></div>
        <div className="relative container mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Shopping Agent
            </h1>
            <p className="text-xl text-gray-300 mb-8 font-light">
              AI-powered deal discovery from Aritzia, Reformation, and Free People
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></div>
              <span className="text-sm font-medium">Auto-saves to Notion</span>
            </div>
            <div className="flex justify-center space-x-4">
              <a
                href="/agents"
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm border border-white/20"
              >
                Manage Background Agents
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white text-black py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Find Your Perfect Deals</h2>
              <p className="text-gray-600">Search by clothing type, size, and brand preferences</p>
            </div>
            
            <SearchForm onSearch={handleSearch} loading={loading} />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-black py-16">
        <div className="container mx-auto px-6">
          {error && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-6 py-4 rounded-xl backdrop-blur-sm">
                <div className="flex items-center">
                  <div className="w-5 h-5 mr-3">⚠️</div>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="max-w-4xl mx-auto">
              <LoadingSpinner />
            </div>
          )}

          {deals.length > 0 && (
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Found {deals.length} deals
                  </h2>
                  <p className="text-gray-400">Curated just for you</p>
                </div>
                <button
                  onClick={handleManualNotionSave}
                  disabled={loading}
                  className="bg-white text-black hover:bg-gray-100 disabled:bg-gray-600 disabled:text-gray-400 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  {loading ? 'Saving...' : 'Add to Notion'}
                </button>
              </div>
              
              {notionStatus && (
                <div className={`mb-8 p-4 rounded-xl backdrop-blur-sm border ${
                  notionStatus.includes('✅') 
                    ? 'bg-green-900/20 border-green-500/30 text-green-300' 
                    : notionStatus.includes('❌')
                    ? 'bg-red-900/20 border-red-500/30 text-red-300'
                    : 'bg-blue-900/20 border-blue-500/30 text-blue-300'
                }`}>
                  <div className="flex items-center">
                    <div className="w-5 h-5 mr-3">
                      {notionStatus.includes('✅') ? '✅' : notionStatus.includes('❌') ? '❌' : '⏳'}
                    </div>
                    <span className="font-medium">{notionStatus}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {deals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}