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
            // Update error message to show Notion success
            if (scrapeData.data.errors.length > 0) {
              setError(`Scraping errors: ${scrapeData.data.errors.join(', ')}. But ${notionData.data.successful} deals saved to Notion successfully.`);
            } else {
              setError(null); // Clear any previous errors
            }
          } else {
            setError(`Scraping successful but Notion save failed: ${notionData.error}`);
          }
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
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Found {deals.length} deals
                </h2>
                <p className="text-green-600 text-sm">
                  ✅ Deals automatically saved to your Notion database
                </p>
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