// 订单相关类型定义
import { Decimal } from 'decimal.js';

/**
 * 订单状态枚举（对应数据库 orders_order_status）
 */
export enum OrderStatus {
  CREATED = 'created',       // 已创建
  CONFIRMED = 'confirmed',   // 已确认
  PREPARING = 'preparing',   // 制作中
  DELIVERING = 'delivering', // 配送中
  COMPLETED = 'completed',   // 已完成
  CANCELLED = 'cancelled'    // 已取消
}

/**
 * 支付状态枚举（对应数据库 payment_status）
 */
export enum PaymentStatus {
  PENDING = 'pending',       // 待支付
  PROCESSING = 'processing', // 支付中
  SUCCESS = 'success',       // 支付成功
  FAILED = 'failed',         // 支付失败
}

/**
 * 支付状态枚举（对应数据库 orders_payment_status）
 */
export enum OrderPaymentStatus {
  PENDING = 'pending',       // 待支付
  PROCESSING = 'processing', // 支付中
  SUCCESS = 'success',       // 支付成功
  FAILED = 'failed',         // 支付失败
  REFUNDING = 'refunding',   // 退款中
  REFUNDED = 'refunded'      // 已退款
}

/**
 * 支付方式枚举（对应数据库 orders_payment_method）
 */
export enum PaymentMethod {
  WECHAT = 'wechat',    // 微信支付
  ALIPAY = 'alipay',    // 支付宝
  BALANCE = 'balance',  // 余额支付
  APPLE = 'apple'       // Apple Pay
}

/**
 * 订单实体接口（对应数据库 orders 表）
 */
export interface Order {
  /** 订单唯一标识ID */
  id?: number;
  /** 订单号（唯一） */
  orderNumber: string;
  /** 用户ID */
  userId: number;
  /** 餐厅ID */
  restaurantId: number;
    /** 餐厅名称 */
  restaurantName: string;
  /** 收货地址ID */
  addressId: number;
  /** 联系人姓名 */
  contactName: string;
  /** 联系人电话 */
  contactPhone: string;
  /** 配送地址 */
  deliveryAddress: string;
  /** 订单状态 */
  orderStatus: OrderStatus;
  /** 支付状态 */
  paymentStatus: OrderPaymentStatus;
  /** 支付方式 */
  paymentMethod: PaymentMethod;
  /** 商品小计金额 */
  subtotal: Decimal;
  /** 配送费 */
  deliveryFee: Decimal;
  /** 优惠金额 */
  discountAmount?: Decimal;
  /** 订单总金额 */
  totalAmount: Decimal;
  /** 优惠券ID，可选 */
  couponId?: number | null;
  /** 订单备注，可选 */
  orderNote?: string | null;
  /** 期望送达时间，可选 */
  deliveryTime?: string | null;
  /** 预计送达时间，可选 */
  estimatedDeliveryTime: Date | null;
  /** 实际送达时间，可选 */
  actualDeliveryTime?: Date | null;
  /** 创建时间 */
  createdAt?: Date | null;
  /** 更新时间 */
  updatedAt?: Date | null;
  /** 支付时间，可选 */
  paidAt?: Date  | null;
  /** 完成时间，可选 */
  completedAt?: Date  | null;
  /** 取消时间，可选 */
  cancelledAt?: Date | null;
  /** 取消原因，可选 */
  cancelReason?: string | null;

  //订单菜品详细信息项
  orderItems: OrderItem[];
}

/**
 * 订单项实体接口（对应数据库 order_items 表）
 */
export interface OrderItem {
  /** 订单项唯一标识ID */
  id?: number;
  /** 所属订单ID */
  orderId?: number;
  /** 菜品ID */
  dishId: number;
  /** 菜品名称（冗余存储） */
  dishName: string;
  /** 菜品图片URL（冗余存储），可选 */
  dishImage?: string | null;
  /** 下单时菜品单价 */
  dishPrice: Decimal;
  /** 菜品数量 */
  quantity: number;
  /** 小计金额 */
  subtotal: Decimal;
  /** 创建时间 */
  createdAt?: Date;
}

// ==================== 下单接口请求参数实体类 ====================

/**
 * 下单接口的菜品项信息
 */
export interface OrderDishItem {
  /** 菜品ID */
  id: number;
  /** 菜品名称 */
  name: string;
  /** 菜品单价 */
  price: number;
  /** 菜品图片URL */
  image: string;
  /** 菜品描述 */
  description: string;
  /** 餐厅ID */
  restaurantId: number;
  /** 餐厅名称 */
  restaurantName: string;
  /** 分类ID */
  categoryId: number;
  /** 购买数量 */
  quantity: number;
}

/**
 * 下单接口请求参数接口
 * 对应前端提交订单时的完整数据结构
 */
export interface PlaceOrderRequest {
  /** 餐厅ID */
  restaurantId: number;
  /** 收货地址ID */
  addressId: number;
  /** 购买的菜品列表 */
  items: OrderDishItem[];
  /** 支付方式 */
  paymentMethod: PaymentMethod;
  /** 期望送达时间 */
  deliveryTime: string;
  /** 订单备注，可选 */
  note?: string;
  /** 商品小计金额 */
  subtotal: number;
  /** 配送费 */
  deliveryFee: number;
  /** 订单总金额 */
  total: number;
}

/**
 * 下单接口响应数据接口
 */
export interface PlaceOrderResponse {
  /** 订单ID */
  orderId: number;
  /** 订单号 */
  orderNumber: string;
  /** 支付方式 */
  paymentMethod: PaymentMethod;
}

/**
 * 下单数据验证错误接口
 */
export interface OrderValidationError {
  /** 字段名称 */
  field: string;
  /** 错误消息 */
  message: string;
  /** 错误代码 */
  code?: string;
}

/**
 * 下单失败响应接口
 */
export interface PlaceOrderErrorResponse {
  /** 是否成功 */
  success: false;
  /** 错误消息 */
  message: string;
  /** 错误代码 */
  code: string;
  /** 验证错误列表，可选 */
  errors?: OrderValidationError[];
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
    contactName: string;
    /** 收件人手机号 */
    contactPhone: string;
    /** 省份 */
    province: string;
    /** 城市 */
    city: string;
    /** 区县 */
    district: string;
    /** 详细地址 */
    detailAddress: string;
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
  /** 支付方式 */
  paymentMethod: PaymentMethod;
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
  status?: OrderStatus;
  /** 支付状态，可选 */
  paymentStatus?: PaymentStatus;
  /** 开始日期，可选 */
  startDate?: string;
  /** 结束日期，可选 */
  endDate?: string;
  /** 排序字段，可选 */
  sortBy?: 'createdAt' | 'totalAmount' | 'orderStatus' | 'paymentStatus';
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

// ==================== 以下是新增的实体类 ====================

/**
 * 操作员类型枚举（对应数据库 order_status_logs_operator_type）
 */
export enum OperatorType {
  USER = 'user',         // 用户
  MERCHANT = 'merchant', // 商户
  DELIVERY = 'delivery', // 配送员
  SYSTEM = 'system'      // 系统
}

/**
 * 订单状态日志实体接口（对应数据库 order_status_logs 表）
 */
export interface OrderStatusLog {
  /** 日志唯一标识ID */
  id: number;
  /** 订单ID */
  orderId: number;
  /** 原状态，可选 */
  oldStatus?: string;
  /** 新状态 */
  newStatus: string;
  /** 操作员ID，可选 */
  operatorId?: number;
  /** 操作员类型 */
  operatorType: OperatorType;
  /** 备注信息，可选 */
  remark?: string;
  /** 创建时间 */
  createdAt: Date;
}

/**
 * 支付记录实体接口（对应数据库 payment_records 表）
 */
export interface PaymentRecord {
  /** 支付记录唯一标识ID */
  id: number;
  /** 订单ID */
  orderId: number;
  /** 用户ID */
  userId: number;
  /** 支付方式 */
  paymentMethod: PaymentMethod;
  /** 支付金额 */
  paymentAmount: Decimal;
  /** 第三方交易ID，可选 */
  transactionId: string;
  /** 支付状态 */
  paymentStatus: PaymentStatus;
  /** 支付时间，可选 */
  paymentTime?: Date | null;
  /** 支付失败原因，可选 */
  failureReason?: string | null;
  /** 创建时间 */
  createdAt?: Date;
  /** 更新时间 */
  updatedAt?: Date;
}

/**
 * 退款类型枚举（对应数据库 refund_records_refund_type）
 */
export enum RefundType {
  FULL = 'full',     // 全额退款
  PARTIAL = 'partial' // 部分退款
}

/**
 * 退款状态枚举（对应数据库 refund_records_refund_status）
 */
export enum RefundStatus {
  PENDING = 'pending',   // 待处理
  APPROVED = 'approved', // 已同意
  REJECTED = 'rejected', // 已拒绝
  COMPLETED = 'completed', // 已完成
  FAILED = 'failed'      // 退款失败
}

/**
 * 处理人类型枚举（对应数据库 refund_records_processor_type）
 */
export enum ProcessorType {
  USER = 'user',         // 用户
  MERCHANT = 'merchant', // 商户
  SYSTEM = 'system'      // 系统
}

/**
 * 退款记录实体接口（对应数据库 refund_records 表）
 */
export interface RefundRecord {
  /** 退款记录唯一标识ID */
  id: number;
  /** 订单ID */
  orderId: number;
  /** 用户ID */
  userId: number;
  /** 支付记录ID */
  paymentRecordId: number;
  /** 退款金额 */
  refundAmount: Decimal;
  /** 退款原因 */
  refundReason: string;
  /** 退款类型 */
  refundType: RefundType;
  /** 退款状态 */
  refundStatus: RefundStatus;
  /** 退款交易ID，可选 */
  refundTransactionId?: string;
  /** 处理人ID，可选 */
  processorId?: number;
  /** 处理人类型 */
  processorType: ProcessorType;
  /** 处理备注，可选 */
  processRemark?: string;
  /** 处理时间，可选 */
  processedAt?: Date;
  /** 完成时间，可选 */
  completedAt?: Date;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 配送信息配送状态枚举（对应数据库 delivery_info_delivery_status）
 */
export enum DeliveryStatus {
  ASSIGNED = 'assigned',   // 已分配
  PICKED_UP = 'picked_up', // 已取餐
  DELIVERING = 'delivering', // 配送中
  DELIVERED = 'delivered'   // 已送达
}

/**
 * 配送信息实体接口（对应数据库 delivery_info 表）
 */
export interface DeliveryInfo {
  /** 配送信息唯一标识ID */
  id: number;
  /** 订单ID（唯一） */
  orderId: number;
  /** 配送员ID，可选 */
  deliveryUserId?: number;
  /** 配送状态 */
  deliveryStatus: DeliveryStatus;
  /** 分配时间，可选 */
  assignedAt?: Date;
  /** 取餐时间，可选 */
  pickedUpAt?: Date;
  /** 送达时间，可选 */
  deliveredAt?: Date;
  /** 配送距离（公里），可选 */
  deliveryDistance?: number;
  /** 配送时长（分钟），可选 */
  deliveryDuration?: number;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

// ==================== 支付相关接口 ====================

/**
 * 支付订单响应数据接口
 */
export interface PayOrderResponse {
  /** 支付记录ID */
  paymentId: number;
  /** 订单ID */
  orderId: number;
  /** 支付方式 */
  paymentMethod: PaymentMethod;
  /** 支付金额 */
  paymentAmount: Decimal;
  /** 第三方交易ID，可选 */
  transactionId?: string;
  /** 支付状态 */
  paymentStatus: PaymentStatus;
}

// ==================== 退款相关接口 ====================

/**
 * 退款订单请求参数接口
 */
export interface RefundOrderRequest {
  /** 订单ID */
  orderId: number;
  /** 退款原因 */
  reason: string;
}

/**
 * 退款订单响应数据接口
 */
export interface RefundOrderResponse {
  /** 退款记录ID */
  refundId: number;
  /** 订单ID */
  orderId: number;
  /** 退款金额 */
  refundAmount: Decimal;
  /** 退款状态 */
  refundStatus: RefundStatus;
  /** 退款类型 */
  refundType: RefundType;
}

// ==================== 确认收货相关接口 ====================

/**
 * 确认收货响应数据接口
 */
export interface ConfirmOrderResponse {
  /** 订单ID */
  orderId: number;
  /** 订单状态 */
  orderStatus: OrderStatus;
  /** 完成时间 */
  completedAt: Date;
}

// ==================== 订单查询相关接口 ====================

/**
 * 订单列表查询请求参数接口
 */
export interface GetOrderListRequest {
  /** 页码，可选 */
  page?: number;
  /** 每页数量，可选 */
  limit?: number;
  /** 订单状态，可选 */
  status?: OrderStatus;
}

/**
 * 订单列表响应数据接口
 */
export interface GetOrderListResponse {
  /** 订单列表 */
  orders: OrderWithDetails[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  limit: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * 订单详情响应数据接口
 */
export interface GetOrderDetailResponse {
  /** 订单详细信息 */
  order: OrderWithDetails;
}

// ==================== 订单统计相关接口 ====================

/**
 * 订单统计请求参数接口
 */
export interface GetOrderStatisticsRequest {
  /** 开始日期，可选 */
  startDate?: string;
  /** 结束日期，可选 */
  endDate?: string;
}

/**
 * 订单统计响应数据接口
 */
export interface GetOrderStatisticsResponse {
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

/**
 * 订单状态统计请求参数接口
 */
export interface GetOrderStatusCountRequest {
  /** 开始日期，可选 */
  startDate?: string;
  /** 结束日期，可选 */
  endDate?: string;
}

/**
 * 订单状态统计响应数据接口
 */
export interface GetOrderStatusCountResponse {
  /** 已创建订单数 */
  created: number;
  /** 已确认订单数 */
  confirmed: number;
  /** 制作中订单数 */
  preparing: number;
  /** 配送中订单数 */
  delivering: number;
  /** 已完成订单数 */
  completed: number;
  /** 已取消订单数 */
  cancelled: number;
}

/**
 * 订单历史统计请求参数接口
 */
export interface GetOrderHistoryRequest {
  /** 开始日期，可选 */
  startDate?: string;
  /** 结束日期，可选 */
  endDate?: string;
  /** 统计类型，可选 */
  type?: 'daily' | 'weekly' | 'monthly';
}

/**
 * 订单历史统计数据项接口
 */
export interface OrderHistoryItem {
  /** 日期 */
  date: string;
  /** 订单数量 */
  orderCount: number;
  /** 订单金额 */
  orderAmount: number;
}

/**
 * 订单历史统计响应数据接口
 */
export interface GetOrderHistoryResponse {
  /** 历史数据列表 */
  history: OrderHistoryItem[];
  /** 总订单数 */
  totalOrders: number;
  /** 总订单金额 */
  totalAmount: number;
}

// ==================== 订单评价相关接口 ====================

/**
 * 订单评价实体接口（对应数据库 order_reviews 表）
 */
export interface OrderReview {
  /** 评价唯一标识ID */
  id?: number;
  /** 订单ID */
  orderId: number;
  /** 用户ID */
  userId: number;
  /** 餐厅ID */
  restaurantId: number;
  /** 评分（1-5分） */
  rating: number;
  /** 评论内容，可选 */
  comment?: string;
  /** 评价图片URL列表，可选 */
  images?: string[];
  /** 创建时间 */
  createdAt?: Date;
  /** 更新时间 */
  updatedAt?: Date;
}

/**
 * 创建订单评价请求参数接口
 */
export interface CreateOrderReviewRequest {
  /** 订单ID */
  orderId: number;
  /** 评分（1-5分） */
  rating: number;
  /** 评论内容，可选 */
  comment?: string;
  /** 评价图片URL列表，可选 */
  images?: string[];
}

/**
 * 创建订单评价响应数据接口
 */
export interface CreateOrderReviewResponse {
  /** 评价ID */
  reviewId: number;
  /** 订单ID */
  orderId: number;
  /** 评分 */
  rating: number;
  /** 评价时间 */
  createdAt: Date;
}

/**
 * 获取订单评价列表请求参数接口
 */
export interface GetOrderReviewsRequest {
  /** 订单ID */
  orderId: number;
}

/**
 * 获取订单评价列表响应数据接口
 */
export interface GetOrderReviewsResponse {
  /** 评价列表 */
  reviews: OrderReview[];
  /** 总评价数 */
  total: number;
  /** 平均评分 */
  averageRating: number;
}

// ==================== 配送信息相关接口 ====================

/**
 * 获取配送信息响应数据接口
 */
export interface GetDeliveryInfoResponse {
  /** 配送信息 */
  deliveryInfo: DeliveryInfo;
  /** 配送员信息，可选 */
  deliveryUser?: {
    /** 配送员ID */
    id?: number;
    /** 配送员姓名 */
    name?: string;
    /** 配送员电话 */
    phone?: string;
    /** 配送员头像 */
    avatar?: string;
  };
}