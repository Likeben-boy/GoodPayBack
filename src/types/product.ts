// 商品相关类型定义

/**
 * 商品实体接口
 */
export interface Product {
  /** 商品唯一标识ID */
  id: number;
  /** 所属餐厅ID */
  restaurantId: number;
  /** 所属分类ID */
  categoryId: number;
  /** 商品名称 */
  name: string;
  /** 商品描述，可选 */
  description?: string;
  /** 商品图片URL，可选 */
  image?: string;
  /** 商品售价 */
  price: number;
  /** 商品原价，可选 */
  originalPrice?: number;
  /** 库存数量 */
  stock: number;
  /** 销售数量 */
  salesCount: number;
  /** 商品评分（0-5分） */
  rating: number;
  /** 评论数量 */
  reviewCount: number;
  /** 是否为特色商品 */
  isFeatured: boolean;
  /** 是否可售 */
  isAvailable: boolean;
  /** 是否推荐 */
  isRecommended: boolean;
  /** 排序序号 */
  sortOrder: number;
  /** 商品标签列表，可选 */
  tags?: string[];
  /** 商品规格列表，可选 */
  specifications?: ProductSpecification[];
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 商品分类接口
 */
export interface ProductCategory {
  /** 分类唯一标识ID */
  id: number;
  /** 所属餐厅ID */
  restaurantId: number;
  /** 分类名称 */
  name: string;
  /** 分类描述，可选 */
  description?: string;
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
 * 商品规格接口
 */
export interface ProductSpecification {
  /** 规格名称（如：尺寸、口味等） */
  name: string;
  /** 规格选项列表 */
  options: ProductSpecificationOption[];
}

/**
 * 商品规格选项接口
 */
export interface ProductSpecificationOption {
  /** 选项名称（如：大杯、微糖等） */
  name: string;
  /** 选项价格加成 */
  price: number;
  /** 选项库存，可选 */
  stock?: number;
}

/**
 * 创建商品请求参数接口
 */
export interface CreateProductInput {
  /** 所属餐厅ID */
  restaurantId: number;
  /** 所属分类ID */
  categoryId: number;
  /** 商品名称 */
  name: string;
  /** 商品描述，可选 */
  description?: string;
  /** 商品图片URL，可选 */
  image?: string;
  /** 商品售价 */
  price: number;
  /** 商品原价，可选 */
  originalPrice?: number;
  /** 库存数量，可选 */
  stock?: number;
  /** 是否为特色商品，可选 */
  isFeatured?: boolean;
  /** 是否可售，可选 */
  isAvailable?: boolean;
  /** 是否推荐，可选 */
  isRecommended?: boolean;
  /** 排序序号，可选 */
  sortOrder?: number;
  /** 商品标签列表，可选 */
  tags?: string[];
  /** 商品规格列表，可选 */
  specifications?: ProductSpecification[];
}

/**
 * 更新商品请求参数接口
 */
export interface UpdateProductInput {
  /** 所属分类ID，可选 */
  categoryId?: number;
  /** 商品名称，可选 */
  name?: string;
  /** 商品描述，可选 */
  description?: string;
  /** 商品图片URL，可选 */
  image?: string;
  /** 商品售价，可选 */
  price?: number;
  /** 商品原价，可选 */
  originalPrice?: number;
  /** 库存数量，可选 */
  stock?: number;
  /** 是否为特色商品，可选 */
  isFeatured?: boolean;
  /** 是否可售，可选 */
  isAvailable?: boolean;
  /** 是否推荐，可选 */
  isRecommended?: boolean;
  /** 排序序号，可选 */
  sortOrder?: number;
  /** 商品标签列表，可选 */
  tags?: string[];
  /** 商品规格列表，可选 */
  specifications?: ProductSpecification[];
}

/**
 * 商品查询参数接口
 */
export interface ProductQueryParams {
  /** 页码，可选 */
  page?: number;
  /** 每页数量，可选 */
  limit?: number;
  /** 分类名称，可选 */
  category?: string;
  /** 餐厅ID，可选 */
  restaurantId?: number;
  /** 最低价格，可选 */
  minPrice?: number;
  /** 最高价格，可选 */
  maxPrice?: number;
  /** 是否只查询可售商品，可选 */
  isAvailable?: boolean;
  /** 关键词搜索，可选 */
  keyword?: string;
  /** 排序字段，可选 */
  sortBy?: 'name' | 'price' | 'rating' | 'sales' | 'createdAt';
  /** 排序方向，可选 */
  sortOrder?: 'asc' | 'desc';
}