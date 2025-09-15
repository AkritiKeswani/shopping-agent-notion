// Legacy types - keeping for backward compatibility
export interface Deal {
  id: string;
  title: string;
  brand: 'aritzia' | 'reformation' | 'free-people';
  originalPrice: number;
  salePrice: number;
  size: string;
  clothingType: 'jeans' | 'shirt' | 'dress' | 'top' | 'bottom' | 'outerwear' | 'accessories';
  imageUrl: string;
  productUrl: string;
  inStock: boolean;
  scrapedAt: Date;
}

export interface SearchFilters {
  clothingType?: string;
  size?: string;
  maxPrice?: number;
  brands?: string[];
}

export interface ScrapingResult {
  deals: Deal[];
  totalFound: number;
  errors: string[];
}

export interface NotionDeal {
  Name: string;
  Brand: string;
  Price: number;
  Sizes: string;
  'Wanted Size': string;
  URL: string;
  'Image URL': string;
  'Session URL': string;
  Selected: boolean;
  Month: string;
}
