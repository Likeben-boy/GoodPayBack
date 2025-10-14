// 支付相关类型定义
export interface Payment {
  id: number;
  orderId: number;
  paymentNumber: string;
  paymentMethod: 'wechat' | 'alipay' | 'balance';
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  transactionId?: string;
  paymentTime?: Date;
  refundId?: string;
  refundTime?: Date;
  refundAmount: number;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserBalance {
  id: number;
  userId: number;
  balance: number;
  frozenBalance: number;
  totalRecharge: number;
  totalConsume: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BalanceTransaction {
  id: number;
  userId: number;
  type: 'recharge' | 'consume' | 'refund' | 'withdrawal';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  relatedId?: number;
  relatedType?: string;
  createdAt: Date;
}

export interface CreatePaymentInput {
  orderId: number;
  paymentMethod: 'wechat' | 'alipay' | 'balance';
  amount: number;
}

export interface WechatPayInput {
  orderId: number;
  amount: number;
  openid?: string;
}

export interface AlipayPayInput {
  orderId: number;
  amount: number;
  returnUrl?: string;
}

export interface RefundPaymentInput {
  amount: number;
  reason: string;
}

export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  status?: string;
}

export interface BillQueryParams {
  page?: number;
  limit?: number;
  month?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReconciliationQueryParams {
  startDate?: string;
  endDate?: string;
  paymentMethod?: 'wechat' | 'alipay' | 'balance';
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  supportedMethods: string[];
}

export interface PaymentResult {
  success: boolean;
  paymentUrl?: string;
  qrCode?: string;
  prepayId?: string;
  transactionId?: string;
  message?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  message?: string;
}