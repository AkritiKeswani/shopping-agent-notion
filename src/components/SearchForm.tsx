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
    console.log('🔍 SearchForm handleSubmit called with filters:', filters);
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
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Clothing Type
            </label>
            <select
              value={filters.clothingType || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, clothingType: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white"
            >
              {CLOTHING_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Size
            </label>
            <select
              value={filters.size || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, size: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white"
            >
              {SIZES.map(size => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Max Price ($)
            </label>
            <input
              type="number"
              value={filters.maxPrice || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                maxPrice: e.target.value ? Number(e.target.value) : undefined 
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white"
              placeholder="No limit"
            />
          </div>

        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-4">
            Brands
          </label>
          <div className="flex flex-wrap gap-4">
            {BRANDS.map(brand => (
              <label key={brand.value} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.brands?.includes(brand.value) || false}
                  onChange={() => handleBrandChange(brand.value)}
                  className="mr-3 h-5 w-5 text-black focus:ring-black border-gray-300 rounded transition-all duration-200"
                />
                <span className="text-sm font-medium text-gray-800 group-hover:text-black transition-colors duration-200">{brand.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Find Deals'}
        </button>
      </form>
    </div>
  );
}
