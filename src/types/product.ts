// 商品相关类型定义
export interface Product {
  id: number;
  restaurantId: number;
  categoryId: number;
  name: string;
  description?: string;
  image?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  salesCount: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isAvailable: boolean;
  isRecommended: boolean;
  sortOrder: number;
  tags?: string[];
  specifications?: ProductSpecification[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCategory {
  id: number;
  restaurantId: number;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSpecification {
  name: string;
  options: ProductSpecificationOption[];
}

export interface ProductSpecificationOption {
  name: string;
  price: number;
  stock?: number;
}

export interface CreateProductInput {
  restaurantId: number;
  categoryId: number;
  name: string;
  description?: string;
  image?: string;
  price: number;
  originalPrice?: number;
  stock?: number;
  isFeatured?: boolean;
  isAvailable?: boolean;
  isRecommended?: boolean;
  sortOrder?: number;
  tags?: string[];
  specifications?: ProductSpecification[];
}

export interface UpdateProductInput {
  categoryId?: number;
  name?: string;
  description?: string;
  image?: string;
  price?: number;
  originalPrice?: number;
  stock?: number;
  isFeatured?: boolean;
  isAvailable?: boolean;
  isRecommended?: boolean;
  sortOrder?: number;
  tags?: string[];
  specifications?: ProductSpecification[];
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  restaurantId?: number;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  keyword?: string;
  sortBy?: 'name' | 'price' | 'rating' | 'sales' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}