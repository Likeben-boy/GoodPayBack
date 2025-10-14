// 餐厅相关类型定义

/**
 * 餐厅实体接口
 */
export interface Restaurant {
  /** 餐厅唯一标识ID */
  id: number;
  /** 餐厅名称 */
  name: string;
  /** 餐厅描述，可选 */
  description?: string;
  /** 餐厅Logo图片URL，可选 */
  logo?: string;
  /** 餐厅封面图片URL，可选 */
  coverImage?: string;
  /** 联系电话，可选 */
  phone?: string;
  /** 餐厅地址，可选 */
  address?: string;
  /** 纬度坐标，可选 */
  latitude?: number;
  /** 经度坐标，可选 */
  longitude?: number;
  /** 营业时间列表，可选 */
  businessHours?: BusinessHour[];
  /** 配送费用 */
  deliveryFee: number;
  /** 最低起送金额 */
  minOrderAmount: number;
  /** 配送时间（分钟） */
  deliveryTime: number;
  /** 评分（0-5分） */
  rating: number;
  /** 评论数量 */
  reviewCount: number;
  /** 营业状态：营业中、已关闭、临时关闭 */
  status: 'open' | 'closed' | 'temporarily_closed';
  /** 是否为推荐餐厅 */
  isFeatured: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 营业时间接口
 */
export interface BusinessHour {
  /** 星期几（1-7，1代表周一） */
  dayOfWeek: number;
  /** 开门时间（格式：HH:mm） */
  openTime: string;
  /** 关门时间（格式：HH:mm） */
  closeTime: string;
  /** 是否营业 */
  isOpen: boolean;
}

/**
 * 餐厅分类接口
 */
export interface RestaurantCategory {
  /** 分类唯一标识ID */
  id: number;
  /** 分类名称 */
  name: string;
  /** 分类图标URL，可选 */
  icon?: string;
  /** 排序序号 */
  sortOrder: number;
  /** 是否启用 */
  isActive: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 创建餐厅请求参数接口
 */
export interface CreateRestaurantInput {
  /** 餐厅名称 */
  name: string;
  /** 餐厅描述，可选 */
  description?: string;
  /** 餐厅Logo图片URL，可选 */
  logo?: string;
  /** 餐厅封面图片URL，可选 */
  coverImage?: string;
  /** 联系电话，可选 */
  phone?: string;
  /** 餐厅地址，可选 */
  address?: string;
  /** 纬度坐标，可选 */
  latitude?: number;
  /** 经度坐标，可选 */
  longitude?: number;
  /** 营业时间列表，可选 */
  businessHours?: BusinessHour[];
  /** 配送费用，可选 */
  deliveryFee?: number;
  /** 最低起送金额，可选 */
  minOrderAmount?: number;
  /** 配送时间（分钟），可选 */
  deliveryTime?: number;
  /** 营业状态，可选 */
  status?: string;
  /** 是否为推荐餐厅，可选 */
  isFeatured?: boolean;
}

/**
 * 更新餐厅请求参数接口
 */
export interface UpdateRestaurantInput {
  /** 餐厅名称，可选 */
  name?: string;
  /** 餐厅描述，可选 */
  description?: string;
  /** 餐厅Logo图片URL，可选 */
  logo?: string;
  /** 餐厅封面图片URL，可选 */
  coverImage?: string;
  /** 联系电话，可选 */
  phone?: string;
  /** 餐厅地址，可选 */
  address?: string;
  /** 纬度坐标，可选 */
  latitude?: number;
  /** 经度坐标，可选 */
  longitude?: number;
  /** 营业时间列表，可选 */
  businessHours?: BusinessHour[];
  /** 配送费用，可选 */
  deliveryFee?: number;
  /** 最低起送金额，可选 */
  minOrderAmount?: number;
  /** 配送时间（分钟），可选 */
  deliveryTime?: number;
  /** 营业状态，可选 */
  status?: string;
  /** 是否为推荐餐厅，可选 */
  isFeatured?: boolean;
}

/**
 * 餐厅查询参数接口
 */
export interface RestaurantQueryParams {
  /** 页码，可选 */
  page?: number;
  /** 每页数量，可选 */
  limit?: number;
  /** 餐厅分类，可选 */
  category?: string;
  /** 最低评分，可选 */
  minRating?: number;
  /** 最高评分，可选 */
  maxRating?: number;
  /** 是否只查询营业中的餐厅，可选 */
  isOpen?: boolean;
  /** 关键词搜索，可选 */
  keyword?: string;
  /** 纬度坐标（用于距离计算），可选 */
  latitude?: number;
  /** 经度坐标（用于距离计算），可选 */
  longitude?: number;
  /** 搜索半径（公里），可选 */
  radius?: number;
}