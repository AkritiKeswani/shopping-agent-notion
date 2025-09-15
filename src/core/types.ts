// Shared types only - no imports from /lib or /mcp
export interface BrandResult {
  brand: string;
  count: number;
  sessionId: string;
  sessionLink: string;
  error?: string;
}

export interface ShopResponse {
  perBrand: BrandResult[];
  totals: {
    upserts: number;
  };
  budget: {
    cap: number;
    selectedSpend: number;
    remaining: number;
  };
  allItems?: any[]; // Add allItems to the response
}

export interface ShopRequest {
  query: string;
  size: string;
  brands: string[];
  cap: number;
}
