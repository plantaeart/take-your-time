export interface CartItem {
  productId: number;
  quantity: number;
  addedAt: Date;
  updatedAt: Date;
  productName?: string;
  productPrice?: number;
  productImage?: string;
  productQuantity?: number; // Available stock quantity
}

export interface Cart {
  userId: number;
  items: CartItem[];
  totalItems: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItemCreate {
  productId: number;
  quantity: number;
}

export interface CartItemUpdate {
  quantity: number;
}

export interface CartResponse {
  userId: number;
  items: CartItem[];
  totalItems: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cart search response interface for admin search
 */
export interface CartSearchResponse {
  carts: Cart[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}