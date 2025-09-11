export interface Deal {
  id: string;
  title: string;
  brand: 'aritzia' | 'reformation' | 'free-people';
  originalPrice: number;
  salePrice: number;
  discount: number;
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
  minDiscount?: number;
  brands?: string[];
}

export interface ScrapingResult {
  deals: Deal[];
  totalFound: number;
  errors: string[];
}

export interface NotionDeal {
  Title: string;
  Brand: string;
  'Original Price': number;
  'Sale Price': number;
  'Discount %': number;
  Size: string;
  'Clothing Type': string;
  'Image URL': string;
  'Product URL': string;
  'In Stock': boolean;
  'Scraped At': string;
}
