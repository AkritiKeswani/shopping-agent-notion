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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Shopping Agent
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Find the best deals from Aritzia, Reformation, and Free People
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="/agents"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Manage Background Agents
            </a>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <SearchForm onSearch={handleSearch} loading={loading} />
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading && <LoadingSpinner />}

          {deals.length > 0 && (
            <div className="mt-8">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Found {deals.length} deals
                  </h2>
                  <button
                    onClick={handleManualNotionSave}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Saving...' : 'Add to Notion'}
                  </button>
                </div>
                
                {notionStatus && (
                  <div className={`text-sm p-3 rounded-lg ${
                    notionStatus.includes('✅') 
                      ? 'bg-green-100 text-green-800' 
                      : notionStatus.includes('❌')
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {notionStatus}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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