// 餐厅相关类型定义

/**
 * 餐厅实体接口 - 对应 prisma.schema 中的 Restaurants 表
 */
export interface Restaurant {
  /** 餐厅唯一标识ID */
  id: number;
  /** 餐厅名称 - 最大长度100 */
  name: string;
  /** 餐厅图片URL - 最大长度255 */
  image: string;
  /** 餐厅评分 - 最多1位小数，范围0.0-9.9 */
  rating: number;
  /** 配送费用 - 最多2位小数，范围0.00-999.99 */
  deliveryFee: number;
  /** 配送时间（分钟） */
  deliveryTime: number;
  /** 餐厅状态 - true:营业中, false:已关闭 */
  status: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 软删除时间 - 可选 */
  deletedAt?: Date;
  /** 餐厅标签 - 可选，如 ['日料', '寿司'] */
  tags?: string[]
}

/**
 * 餐厅标签实体类 - 对应 prisma.schema 中的 RestaurantTag 表
 */
export interface RestaurantTag {
  /** 标签唯一标识ID */
  id: number;
  /** 标签名称 - 最大长度50，唯一 */
  tagName: string;
  /** 标签类型 */
  tagType: RestaurantTagTagType;
  /** 标签颜色 - 最大长度7，默认值#ff6b6b */
  color: string;
  /** 标签图标 - 最大长度100，可选 */
  icon?: string;
  /** 排序序号 - 默认值0 */
  sortOrder: number;
  /** 标签状态 - true:启用, false:禁用 */
  status: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 餐厅标签类型枚举 - 对应 prisma.schema 中的 restaurant_tag_tag_type
 */
export enum RestaurantTagTagType {
  /** 菜系类型 */
  cuisine = 'cuisine',
  /** 特色标签 */
  feature = 'feature',
  /** 价格区间 */
  price_range = 'price_range',
  /** 服务类型 */
  service = 'service'
}

/**
 * 菜品分类实体类 - 对应 prisma.schema 中的 DishCategories 表
 */
export interface DishCategory {
  /** 分类唯一标识ID */
  id: number;
  /** 所属餐厅ID */
  restaurantId: number;
  /** 分类名称 - 最大长度50 */
  name: string;
  /** 排序序号 - 默认值0 */
  sortOrder: number;
  /** 分类状态 - true:启用, false:禁用 */
  status: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 菜品实体类 - 对应 prisma.schema 中的 Dishes 表
 */
export interface Dish {
  /** 菜品唯一标识ID */
  id: number;
  /** 所属餐厅ID */
  restaurantId: number;
  /** 所属分类ID */
  categoryId: number;
  /** 菜品名称 - 最大长度100 */
  name: string;
  /** 菜品描述 - 文本类型，可选 */
  description?: string;
  /** 菜品价格 - 最多2位小数，范围0.00-999999.99，默认值0.00 */
  price: number;
  /** 菜品图片URL - 最大长度255，可选 */
  image?: string;
  /** 菜品状态 - true:上架, false:下架 */
  status: boolean;
  /** 销售数量 - 默认值0 */
  salesCount: number;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 软删除时间 - 可选 */
  deletedAt?: Date;
}


/**
 * 创建餐厅请求参数接口
 */
export interface CreateRestaurantInput {
  /** 餐厅名称 - 必填，最大长度100 */
  name: string;
  /** 餐厅图片URL - 必填，最大长度255 */
  image: string;
  /** 餐厅评分 - 可选，最多1位小数，默认值0.0 */
  rating?: number;
  /** 配送费用 - 可选，最多2位小数，默认值0.00 */
  deliveryFee?: number;
  /** 配送时间（分钟）- 可选，默认值0 */
  deliveryTime?: number;
  /** 餐厅状态 - 可选，默认值true */
  status?: boolean;
}

/**
 * 搜索餐厅请求参数接口
 */
export interface QueryParams {

  page: number;
  limit: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: string;
  minRating?: number;
  tags?: string | string[];
}

/**
 * 更新餐厅请求参数接口
 */
export interface UpdateRestaurantInput {
  /** 餐厅名称 - 可选，最大长度100 */
  name?: string;
  /** 餐厅图片URL - 可选，最大长度255 */
  image?: string;
  /** 餐厅评分 - 可选，最多1位小数 */
  rating?: number;
  /** 配送费用 - 可选，最多2位小数 */
  deliveryFee?: number;
  /** 配送时间（分钟）- 可选 */
  deliveryTime?: number;
  /** 餐厅状态 - 可选 */
  status?: boolean;
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

/**
 * 创建菜品分类请求参数接口
 */
export interface CreateDishCategoryInput {
  /** 所属餐厅ID - 必填 */
  restaurantId: number;
  /** 分类名称 - 必填，最大长度50 */
  name: string;
  /** 排序序号 - 可选，默认值0 */
  sortOrder?: number;
  /** 分类状态 - 可选，默认值true */
  status?: boolean;
}

/**
 * 更新菜品分类请求参数接口
 */
export interface UpdateDishCategoryInput {
  /** 分类名称 - 可选，最大长度50 */
  name?: string;
  /** 排序序号 - 可选 */
  sortOrder?: number;
  /** 分类状态 - 可选 */
  status?: boolean;
}

/**
 * 创建菜品请求参数接口
 */
export interface CreateDishInput {
  /** 所属餐厅ID - 必填 */
  restaurantId: number;
  /** 所属分类ID - 必填 */
  categoryId: number;
  /** 菜品名称 - 必填，最大长度100 */
  name: string;
  /** 菜品描述 - 可选，文本类型 */
  description?: string;
  /** 菜品价格 - 可选，最多2位小数，默认值0.00 */
  price?: number;
  /** 菜品图片URL - 可选，最大长度255 */
  image?: string;
  /** 菜品状态 - 可选，默认值true */
  status?: boolean;
  /** 销售数量 - 可选，默认值0 */
  salesCount?: number;
}

/**
 * 更新菜品请求参数接口
 */
export interface UpdateDishInput {
  /** 菜品名称 - 可选，最大长度100 */
  name?: string;
  /** 菜品描述 - 可选，文本类型 */
  description?: string;
  /** 菜品价格 - 可选，最多2位小数 */
  price?: number;
  /** 菜品图片URL - 可选，最大长度255 */
  image?: string;
  /** 菜品状态 - 可选 */
  status?: boolean;
  /** 销售数量 - 可选 */
  salesCount?: number;
}

/**
 * 创建餐厅标签请求参数接口
 */
export interface CreateRestaurantTagInput {
  /** 标签名称 - 必填，最大长度50，唯一 */
  tagName: string;
  /** 标签类型 - 可选，默认值cuisine */
  tagType?: RestaurantTagTagType;
  /** 标签颜色 - 可选，默认值#ff6b6b */
  color?: string;
  /** 标签图标 - 可选，最大长度100 */
  icon?: string;
  /** 排序序号 - 可选，默认值0 */
  sortOrder?: number;
  /** 标签状态 - 可选，默认值true */
  status?: boolean;
}

/**
 * 更新餐厅标签请求参数接口
 */
export interface UpdateRestaurantTagInput {
  /** 标签名称 - 可选，最大长度50 */
  tagName?: string;
  /** 标签类型 - 可选 */
  tagType?: RestaurantTagTagType;
  /** 标签颜色 - 可选，最大长度7 */
  color?: string;
  /** 标签图标 - 可选，最大长度100 */
  icon?: string;
  /** 排序序号 - 可选 */
  sortOrder?: number;
  /** 标签状态 - 可选 */
  status?: boolean;
}

/**
 * 创建餐厅标签关联关系请求参数接口
 */
export interface CreateRestaurantTagRelationInput {
  /** 餐厅ID - 必填 */
  restaurantId: number;
  /** 标签ID - 必填 */
  tagId: number;
  /** 创建者ID - 可选 */
  createdBy?: number;
}