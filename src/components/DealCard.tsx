'use client';

import { Deal } from '@/types';
import Image from 'next/image';

interface DealCardProps {
  deal: Deal;
}

export default function DealCard({ deal }: DealCardProps) {
  const getBrandColor = (brand: string) => {
    switch (brand) {
      case 'aritzia':
        return 'bg-pink-100 text-pink-800';
      case 'reformation':
        return 'bg-green-100 text-green-800';
      case 'free-people':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {deal.imageUrl && (
        <div className="relative h-64 w-full">
          <Image
            src={deal.imageUrl}
            alt={deal.title}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBrandColor(deal.brand)}`}>
            {getBrandName(deal.brand)}
          </span>
          <span className="text-xs text-gray-500 capitalize">
            {deal.clothingType}
          </span>
        </div>

        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
          {deal.title}
        </h3>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              ${deal.salePrice}
            </span>
            {deal.originalPrice > deal.salePrice && (
              <span className="text-sm text-gray-500 line-through">
                ${deal.originalPrice}
              </span>
            )}
          </div>
          {deal.discount > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
              -{deal.discount}%
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span>Size: {deal.size}</span>
          <span className={`px-2 py-1 rounded text-xs ${
            deal.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {deal.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        <a
          href={deal.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded font-medium transition-colors"
        >
          View Product
        </a>
      </div>
    </div>
  );
}
