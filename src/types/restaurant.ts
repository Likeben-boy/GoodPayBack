// 餐厅相关类型定义
export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  businessHours?: BusinessHour[];
  deliveryFee: number;
  minOrderAmount: number;
  deliveryTime: number;
  rating: number;
  reviewCount: number;
  status: 'open' | 'closed' | 'temporarily_closed';
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface RestaurantCategory {
  id: number;
  name: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRestaurantInput {
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  businessHours?: BusinessHour[];
  deliveryFee?: number;
  minOrderAmount?: number;
  deliveryTime?: number;
  status?: string;
  isFeatured?: boolean;
}

export interface UpdateRestaurantInput {
  name?: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  businessHours?: BusinessHour[];
  deliveryFee?: number;
  minOrderAmount?: number;
  deliveryTime?: number;
  status?: string;
  isFeatured?: boolean;
}

export interface RestaurantQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  minRating?: number;
  maxRating?: number;
  isOpen?: boolean;
  keyword?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}