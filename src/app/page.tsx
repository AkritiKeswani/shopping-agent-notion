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
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters }),
      });

      const data = await response.json();

      if (data.success) {
        setDeals(data.data.deals);
        if (data.data.errors.length > 0) {
          setError(`Some errors occurred: ${data.data.errors.join(', ')}`);
        }
      } else {
        setError(data.error || 'Failed to fetch deals');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToNotion = async () => {
    if (deals.length === 0) return;

    setLoading(true);
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
        alert(`Successfully saved ${data.data.successful} deals to Notion!`);
      } else {
        setError(data.error || 'Failed to save to Notion');
      }
    } catch (err) {
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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Found {deals.length} deals
                </h2>
                <button
                  onClick={handleSaveToNotion}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Save to Notion
                </button>
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