// 支付相关类型定义

/**
 * 支付记录实体接口
 */
export interface Payment {
  /** 支付记录唯一标识ID */
  id: number;
  /** 关联订单ID */
  orderId: number;
  /** 支付流水号 */
  paymentNumber: string;
  /** 支付方式：微信支付、支付宝、余额支付 */
  paymentMethod: 'wechat' | 'alipay' | 'balance';
  /** 支付金额 */
  amount: number;
  /** 支付状态：待支付、已支付、支付失败、已退款、已取消 */
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  /** 第三方交易流水号，可选 */
  transactionId?: string;
  /** 支付完成时间，可选 */
  paymentTime?: Date;
  /** 退款流水号，可选 */
  refundId?: string;
  /** 退款时间，可选 */
  refundTime?: Date;
  /** 退款金额 */
  refundAmount: number;
  /** 退款原因，可选 */
  refundReason?: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 用户余额账户接口
 */
export interface UserBalance {
  /** 余额账户唯一标识ID */
  id: number;
  /** 用户ID */
  userId: number;
  /** 可用余额 */
  balance: number;
  /** 冻结余额 */
  frozenBalance: number;
  /** 累计充值金额 */
  totalRecharge: number;
  /** 累计消费金额 */
  totalConsume: number;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 余额交易记录接口
 */
export interface BalanceTransaction {
  /** 交易记录唯一标识ID */
  id: number;
  /** 用户ID */
  userId: number;
  /** 交易类型：充值、消费、退款、提现 */
  type: 'recharge' | 'consume' | 'refund' | 'withdrawal';
  /** 交易金额 */
  amount: number;
  /** 交易前余额 */
  balanceBefore: number;
  /** 交易后余额 */
  balanceAfter: number;
  /** 交易描述，可选 */
  description?: string;
  /** 关联业务ID，可选 */
  relatedId?: number;
  /** 关联业务类型，可选 */
  relatedType?: string;
  /** 创建时间 */
  createdAt: Date;
}

/**
 * 创建支付请求参数接口
 */
export interface CreatePaymentInput {
  /** 订单ID */
  orderId: number;
  /** 支付方式：微信支付、支付宝、余额支付 */
  paymentMethod: 'wechat' | 'alipay' | 'balance';
  /** 支付金额 */
  amount: number;
}

/**
 * 微信支付请求参数接口
 */
export interface WechatPayInput {
  /** 订单ID */
  orderId: number;
  /** 支付金额 */
  amount: number;
  /** 用户openid（小程序/公众号支付），可选 */
  openid?: string;
}

/**
 * 支付宝支付请求参数接口
 */
export interface AlipayPayInput {
  /** 订单ID */
  orderId: number;
  /** 支付金额 */
  amount: number;
  /** 支付成功跳转URL，可选 */
  returnUrl?: string;
}

/**
 * 退款请求参数接口
 */
export interface RefundPaymentInput {
  /** 退款金额 */
  amount: number;
  /** 退款原因 */
  reason: string;
}

/**
 * 支付记录查询参数接口
 */
export interface PaymentQueryParams {
  /** 页码，可选 */
  page?: number;
  /** 每页数量，可选 */
  limit?: number;
  /** 开始日期，可选 */
  startDate?: string;
  /** 结束日期，可选 */
  endDate?: string;
  /** 支付方式，可选 */
  paymentMethod?: string;
  /** 支付状态，可选 */
  status?: string;
}

/**
 * 账单查询参数接口
 */
export interface BillQueryParams {
  /** 页码，可选 */
  page?: number;
  /** 每页数量，可选 */
  limit?: number;
  /** 查询月份（格式：YYYY-MM），可选 */
  month?: string;
  /** 开始日期，可选 */
  startDate?: string;
  /** 结束日期，可选 */
  endDate?: string;
}

/**
 * 对账查询参数接口
 */
export interface ReconciliationQueryParams {
  /** 开始日期，可选 */
  startDate?: string;
  /** 结束日期，可选 */
  endDate?: string;
  /** 支付方式，可选 */
  paymentMethod?: 'wechat' | 'alipay' | 'balance';
}

/**
 * 支付方式配置接口
 */
export interface PaymentMethod {
  /** 支付方式标识 */
  id: string;
  /** 支付方式名称 */
  name: string;
  /** 支付方式图标URL，可选 */
  icon?: string;
  /** 支付方式描述，可选 */
  description?: string;
  /** 是否启用 */
  isActive: boolean;
  /** 支持的支付方法列表 */
  supportedMethods: string[];
}

/**
 * 支付结果接口
 */
export interface PaymentResult {
  /** 支付是否成功 */
  success: boolean;
  /** 支付链接（用于跳转支付），可选 */
  paymentUrl?: string;
  /** 二维码内容（用于扫码支付），可选 */
  qrCode?: string;
  /** 预支付交易会话标识（微信支付），可选 */
  prepayId?: string;
  /** 第三方交易流水号，可选 */
  transactionId?: string;
  /** 结果消息，可选 */
  message?: string;
}

/**
 * 退款结果接口
 */
export interface RefundResult {
  /** 退款是否成功 */
  success: boolean;
  /** 退款单号，可选 */
  refundId?: string;
  /** 结果消息，可选 */
  message?: string;
}