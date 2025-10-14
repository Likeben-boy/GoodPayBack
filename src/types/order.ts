// 订单相关类型定义
export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  restaurantId: number;
  addressId: number;
  totalAmount: number;
  deliveryFee: number;
  discountAmount: number;
  actualAmount: number;
  paymentMethod: 'wechat' | 'alipay' | 'balance';
  paymentStatus: 'unpaid' | 'paid' | 'refunded' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'completed' | 'cancelled';
  orderNotes?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  cancellationReason?: string;
  rating?: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  totalPrice: number;
  specifications?: Record<string, any>;
  notes?: string;
  createdAt: Date;
}

export interface CreateOrderInput {
  addressId: number;
  items: CreateOrderItemInput[];
  paymentMethod: 'wechat' | 'alipay' | 'balance';
  notes?: string;
}

export interface CreateOrderItemInput {
  productId: number;
  quantity: number;
  price: number;
  specifications?: Record<string, any>;
  notes?: string;
}

export interface OrderWithDetails extends Order {
  items: OrderItem[];
  restaurant: {
    id: number;
    name: string;
    phone?: string;
    address?: string;
  };
  address: {
    id: number;
    recipient: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    detailedAddress: string;
  };
}

export interface CancelOrderInput {
  reason?: string;
}

export interface PayOrderInput {
  paymentMethod: 'wechat' | 'alipay' | 'balance';
}

export interface RefundOrderInput {
  reason: string;
  amount?: number;
}

export interface ReviewOrderInput {
  rating: number;
  comment?: string;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'totalAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface OrderStatistics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalAmount: number;
  averageAmount: number;
}