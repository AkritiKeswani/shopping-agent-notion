'use client';

import { Deal } from '@/types';
import Image from 'next/image';
import { useState } from 'react';

interface DealCardProps {
  deal: Deal;
  onSaveToNotion?: (deal: Deal) => Promise<void>;
}

export default function DealCard({ deal, onSaveToNotion }: DealCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSaveToNotion = async () => {
    if (!onSaveToNotion) return;
    
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      await onSaveToNotion(deal);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000); // Reset after 2 seconds
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000); // Reset after 3 seconds
    } finally {
      setIsSaving(false);
    }
  };
  const getBrandColor = (brand: string) => {
    switch (brand) {
      case 'aritzia':
        return 'bg-white/20 text-white border-white/30';
      case 'reformation':
        return 'bg-white/20 text-white border-white/30';
      case 'free-people':
        return 'bg-white/20 text-white border-white/30';
      default:
        return 'bg-white/20 text-white border-white/30';
    }
  };

  const getBrandName = (brand: string) => {
    switch (brand) {
      case 'aritzia':
        return 'Aritzia';
      case 'reformation':
        return 'Reformation';
      case 'free-people':
        return 'Free People';
      default:
        return brand;
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-white/20 group">
      {deal.imageUrl && (
        <div className="relative h-64 w-full overflow-hidden">
          <Image
            src={deal.imageUrl}
            alt={deal.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getBrandColor(deal.brand)}`}>
            {getBrandName(deal.brand)}
          </span>
          <span className="text-xs text-gray-400 capitalize font-medium">
            {deal.clothingType}
          </span>
        </div>

        <h3 className="font-semibold text-white mb-3 line-clamp-2 text-lg">
          {deal.title}
        </h3>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold text-white">
              ${deal.salePrice}
            </span>
            {deal.originalPrice > deal.salePrice && (
              <span className="text-sm text-gray-400 line-through">
                ${deal.originalPrice}
              </span>
            )}
          </div>
          {deal.originalPrice > deal.salePrice && (
            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-lg border border-green-500/30">
              SALE
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-300 mb-4">
          <span className="font-medium">Size: {deal.size}</span>
          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
            deal.inStock ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {deal.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        <div className="space-y-3">
          <a
            href={deal.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-white text-black hover:bg-gray-100 text-center py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
          >
            View Product
          </a>
          
          {onSaveToNotion && (
            <button
              onClick={handleSaveToNotion}
              disabled={isSaving}
              className={`w-full py-2 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed ${
                saveStatus === 'saved' 
                  ? 'bg-green-500 text-white' 
                  : saveStatus === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && '✅ Saved!'}
              {saveStatus === 'error' && '❌ Error'}
              {saveStatus === 'idle' && 'Save to Notion'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
