export interface ProductVariant {
  weight: string;
  price: number;
  stock?: number;
  costPrice: number;        // per unit/weight
  packagingCost: number;     // box, bubble wrap, etc.
  handlingCost: number;      // labor, storage, etc.
  profitMargin: number;      // percentage (e.g. 30)
  minProfit: number;         // absolute minimum (e.g. 50)
  cost?: number;             // total landed cost (optional, for overrides)
}

export interface Product {
  id: string | number;
  name: string;
  category: string;
  type?: 'veg' | 'non-veg' | 'sweet' | 'pindi-vantalu' | 'hot-snacks' | 'ghee' | 'oil';
  description?: string;
  image?: string;
  imageUrl?: string;
  variants: ProductVariant[];
  stock?: number;
  isActive?: boolean;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
}

export const CATEGORIES: string[] = [];

export const products: Product[] = [];

export const getProductById = (id: string | number) => {
  return products.find(p => p.id.toString() === id.toString());
};

export const getProductsByCategory = (category: string) => {
  return products.filter(p => p.category === category);
};
