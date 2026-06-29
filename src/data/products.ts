export interface ProductVariant {
  type: 'color' | 'size';
  value: string;
  inStock: boolean;
}

export interface Product {
  id: string;
  title: string;
  seller: string;
  sellerId: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviewsCount: number;
  category: string;
  images: string[];
  description: string;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stockCount: number;
  variants: {
    colors?: string[];
    sizes?: string[];
  };
  specifications: Record<string, string>;
  reviews: {
    id: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
  }[];
}

export const CATEGORIES_LIST = [
  'Electronics',
  'Fashion',
  'Home & Kitchen',
  'Beauty',
  'Grocery',
  'Books',
  'Toys',
  'Sports',
  'Automotive',
  'Mobile Accessories',
  'Furniture',
  'Health'
];

export const mockProducts: Product[] = [];
