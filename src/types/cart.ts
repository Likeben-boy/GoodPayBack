// 购物车相关类型定义

/**
 * 购物车实体接口
 */
export interface Cart {
  /** 购物车项唯一标识ID */
  id: number;
  /** 所属用户ID */
  userId: number;
  /** 商品ID */
  productId: number;
  /** 商品数量 */
  quantity: number;
  /** 加入购物车时的商品价格 */
  price: number;
  /** 商品规格选择（JSON格式），可选 */
  specifications?: Record<string, any>;
  /** 备注信息，可选 */
  notes?: string;
  /** 是否选中（用于结算） */
  isSelected: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 添加购物车项请求参数接口
 */
export interface CreateCartItemInput {
  /** 商品ID */
  productId: number;
  /** 商品数量 */
  quantity: number;
  /** 商品规格选择（JSON格式），可选 */
  specifications?: Record<string, any>;
  /** 备注信息，可选 */
  notes?: string;
}

/**
 * 更新购物车项请求参数接口
 */
export interface UpdateCartItemInput {
  /** 新的商品数量 */
  quantity: number;
}

/**
 * 包含商品信息的购物车项接口
 */
export interface CartWithProduct extends Cart {
  /** 关联的商品信息 */
  product: {
    /** 商品ID */
    id: number;
    /** 商品名称 */
    name: string;
    /** 商品图片URL，可选 */
    image?: string;
    /** 商品当前价格 */
    price: number;
    /** 商品是否可售 */
    isAvailable: boolean;
    /** 商品库存数量 */
    stock: number;
  };
}

/**
 * 批量删除购物车项请求参数接口
 */
export interface BatchRemoveCartItemsInput {
  /** 要删除的购物车项ID列表 */
  itemIds: number[];
}

/**
 * 选择购物车项请求参数接口
 */
export interface SelectCartItemInput {
  /** 是否选中 */
  selected: boolean;
}

/**
 * 全选/取消全选购物车项请求参数接口
 */
export interface SelectAllCartItemsInput {
  /** 是否全选 */
  selected: boolean;
}

/**
 * 合并购物车请求参数接口（用户登录时将游客购物车合并到用户购物车）
 */
export interface MergeCartInput {
  /** 游客购物车项列表 */
  guestCartItems: GuestCartItem[];
}

/**
 * 游客购物车项接口
 */
export interface GuestCartItem {
  /** 商品ID */
  productId: number;
  /** 商品数量 */
  quantity: number;
  /** 商品规格选择（JSON格式），可选 */
  specifications?: Record<string, any>;
  /** 备注信息，可选 */
  notes?: string;
}

/**
 * 购物车汇总信息接口
 */
export interface CartSummary {
  /** 购物车商品总数量 */
  itemCount: number;
  /** 已选中的商品数量 */
  selectedItemCount: number;
  /** 购物车商品总金额 */
  totalAmount: number;
  /** 已选中商品的总金额 */
  selectedTotalAmount: number;
  /** 购物车项列表（包含商品信息） */
  items: CartWithProduct[];
}