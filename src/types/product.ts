export type Product = {
  id: string;               // stable hash of url or site id
  brand: 'aritzia' | 'reformation';
  title: string;
  price: number;            // parse to number in USD
  currency: 'USD';
  url: string;
  image: string | null;
  category: 'tops' | 'bottoms';
  source: 'dom' | 'xhr';
};

export type SearchRequest = {
  brands: ('aritzia' | 'reformation')[];
  category: 'tops' | 'bottoms';
  budget: number;
  compareMode: 'cross-brand' | 'within-brand';
};

export type SearchResponse = {
  status: 'ok';
  results: {
    aritzia?: Product[];
    reformation?: Product[];
  };
} | {
  status: 'human-verify-needed';
  brand: 'aritzia' | 'reformation';
  sessionUrl: string;
};

export type SaveRequest = {
  products: Product[];
};

export type SaveResponse = {
  status: 'ok';
  saved: number;
};
