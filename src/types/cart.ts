// 购物车相关类型定义
export interface Cart {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  price: number;
  specifications?: Record<string, any>;
  notes?: string;
  isSelected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCartItemInput {
  productId: number;
  quantity: number;
  specifications?: Record<string, any>;
  notes?: string;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export interface CartWithProduct extends Cart {
  product: {
    id: number;
    name: string;
    image?: string;
    price: number;
    isAvailable: boolean;
    stock: number;
  };
}

export interface BatchRemoveCartItemsInput {
  itemIds: number[];
}

export interface SelectCartItemInput {
  selected: boolean;
}

export interface SelectAllCartItemsInput {
  selected: boolean;
}

export interface MergeCartInput {
  guestCartItems: GuestCartItem[];
}

export interface GuestCartItem {
  productId: number;
  quantity: number;
  specifications?: Record<string, any>;
  notes?: string;
}

export interface CartSummary {
  itemCount: number;
  selectedItemCount: number;
  totalAmount: number;
  selectedTotalAmount: number;
  items: CartWithProduct[];
}