export interface CartItem {
  productId: number;
  quantity: number;
  addedAt: Date;
  updatedAt: Date;
  productName?: string;
  productPrice?: number;
  productImage?: string;
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

export interface ApiMessage {
  message: string;
}
