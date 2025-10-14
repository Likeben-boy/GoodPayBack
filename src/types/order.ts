// 订单相关类型定义

/**
 * 订单实体接口
 */
export interface Order {
  /** 订单唯一标识ID */
  id: number;
  /** 订单号 */
  orderNumber: string;
  /** 用户ID */
  userId: number;
  /** 餐厅ID */
  restaurantId: number;
  /** 收货地址ID */
  addressId: number;
  /** 订单总金额 */
  totalAmount: number;
  /** 配送费 */
  deliveryFee: number;
  /** 优惠金额 */
  discountAmount: number;
  /** 实际支付金额 */
  actualAmount: number;
  /** 支付方式：微信支付、支付宝、余额支付 */
  paymentMethod: 'wechat' | 'alipay' | 'balance';
  /** 支付状态：未支付、已支付、已退款、支付失败 */
  paymentStatus: 'unpaid' | 'paid' | 'refunded' | 'failed';
  /** 订单状态：待确认、已确认、制作中、配送中、已完成、已取消 */
  orderStatus: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'completed' | 'cancelled';
  /** 订单备注，可选 */
  orderNotes?: string;
  /** 预计送达时间，可选 */
  estimatedDeliveryTime?: Date;
  /** 实际送达时间，可选 */
  actualDeliveryTime?: Date;
  /** 取消原因，可选 */
  cancellationReason?: string;
  /** 用户评分（1-5分），可选 */
  rating?: number;
  /** 用户评论，可选 */
  review?: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 订单项实体接口
 */
export interface OrderItem {
  /** 订单项唯一标识ID */
  id: number;
  /** 所属订单ID */
  orderId: number;
  /** 商品ID */
  productId: number;
  /** 商品名称（冗余存储） */
  productName: string;
  /** 商品图片URL（冗余存储），可选 */
  productImage?: string;
  /** 商品数量 */
  quantity: number;
  /** 下单时商品单价 */
  price: number;
  /** 商品总价 */
  totalPrice: number;
  /** 商品规格选择（JSON格式），可选 */
  specifications?: Record<string, any>;
  /** 商品备注，可选 */
  notes?: string;
  /** 创建时间 */
  createdAt: Date;
}

/**
 * 创建订单请求参数接口
 */
export interface CreateOrderInput {
  /** 收货地址ID */
  addressId: number;
  /** 订单项列表 */
  items: CreateOrderItemInput[];
  /** 支付方式：微信支付、支付宝、余额支付 */
  paymentMethod: 'wechat' | 'alipay' | 'balance';
  /** 订单备注，可选 */
  notes?: string;
}

/**
 * 创建订单项请求参数接口
 */
export interface CreateOrderItemInput {
  /** 商品ID */
  productId: number;
  /** 商品数量 */
  quantity: number;
  /** 商品单价 */
  price: number;
  /** 商品规格选择（JSON格式），可选 */
  specifications?: Record<string, any>;
  /** 商品备注，可选 */
  notes?: string;
}

/**
 * 包含完整详情的订单接口
 */
export interface OrderWithDetails extends Order {
  /** 订单项列表 */
  items: OrderItem[];
  /** 餐厅信息 */
  restaurant: {
    /** 餐厅ID */
    id: number;
    /** 餐厅名称 */
    name: string;
    /** 联系电话，可选 */
    phone?: string;
    /** 餐厅地址，可选 */
    address?: string;
  };
  /** 收货地址信息 */
  address: {
    /** 地址ID */
    id: number;
    /** 收件人姓名 */
    recipient: string;
    /** 收件人手机号 */
    phone: string;
    /** 省份 */
    province: string;
    /** 城市 */
    city: string;
    /** 区县 */
    district: string;
    /** 详细地址 */
    detailedAddress: string;
  };
}

/**
 * 取消订单请求参数接口
 */
export interface CancelOrderInput {
  /** 取消原因，可选 */
  reason?: string;
}

/**
 * 支付订单请求参数接口
 */
export interface PayOrderInput {
  /** 支付方式：微信支付、支付宝、余额支付 */
  paymentMethod: 'wechat' | 'alipay' | 'balance';
}

/**
 * 订单退款请求参数接口
 */
export interface RefundOrderInput {
  /** 退款原因 */
  reason: string;
  /** 退款金额，可选（默认全额退款） */
  amount?: number;
}

/**
 * 订单评价请求参数接口
 */
export interface ReviewOrderInput {
  /** 评分（1-5分） */
  rating: number;
  /** 评论内容，可选 */
  comment?: string;
}

/**
 * 订单查询参数接口
 */
export interface OrderQueryParams {
  /** 页码，可选 */
  page?: number;
  /** 每页数量，可选 */
  limit?: number;
  /** 订单状态，可选 */
  status?: string;
  /** 开始日期，可选 */
  startDate?: string;
  /** 结束日期，可选 */
  endDate?: string;
  /** 排序字段，可选 */
  sortBy?: 'createdAt' | 'totalAmount' | 'status';
  /** 排序方向，可选 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 订单统计信息接口
 */
export interface OrderStatistics {
  /** 总订单数 */
  totalOrders: number;
  /** 已完成订单数 */
  completedOrders: number;
  /** 已取消订单数 */
  cancelledOrders: number;
  /** 总订单金额 */
  totalAmount: number;
  /** 平均订单金额 */
  averageAmount: number;
}