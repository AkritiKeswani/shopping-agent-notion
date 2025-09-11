'use client';

import { useState } from 'react';
import { SearchFilters } from '@/types';

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  loading: boolean;
}

const CLOTHING_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'jeans', label: 'Jeans' },
  { value: 'shirt', label: 'Shirts' },
  { value: 'dress', label: 'Dresses' },
  { value: 'top', label: 'Tops' },
  { value: 'bottom', label: 'Bottoms' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'accessories', label: 'Accessories' },
];

const SIZES = [
  { value: '', label: 'All Sizes' },
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: 'XXL', label: 'XXL' },
  { value: '0', label: '0' },
  { value: '2', label: '2' },
  { value: '4', label: '4' },
  { value: '6', label: '6' },
  { value: '8', label: '8' },
  { value: '10', label: '10' },
  { value: '12', label: '12' },
  { value: '14', label: '14' },
];

const BRANDS = [
  { value: 'aritzia', label: 'Aritzia' },
  { value: 'reformation', label: 'Reformation' },
  { value: 'free-people', label: 'Free People' },
];

export default function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    clothingType: '',
    size: '',
    maxPrice: undefined,
    minDiscount: undefined,
    brands: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleBrandChange = (brand: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands?.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...(prev.brands || []), brand]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clothing Type
            </label>
            <select
              value={filters.clothingType || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, clothingType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CLOTHING_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size
            </label>
            <select
              value={filters.size || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, size: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SIZES.map(size => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Price ($)
            </label>
            <input
              type="number"
              value={filters.maxPrice || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                maxPrice: e.target.value ? Number(e.target.value) : undefined 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="No limit"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Discount (%)
            </label>
            <input
              type="number"
              value={filters.minDiscount || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                minDiscount: e.target.value ? Number(e.target.value) : undefined 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any discount"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brands
          </label>
          <div className="flex flex-wrap gap-3">
            {BRANDS.map(brand => (
              <label key={brand.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.brands?.includes(brand.value) || false}
                  onChange={() => handleBrandChange(brand.value)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{brand.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 px-4 rounded-md font-medium transition-colors"
        >
          {loading ? 'Searching...' : 'Find Deals'}
        </button>
      </form>
    </div>
  );
}
