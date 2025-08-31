export interface WishlistItem {
  productId: number;
  addedAt: Date;
  // Enhanced with product details for UI
  productName?: string;
  productPrice?: number;
  productImage?: string;
  productCategory?: string;
  productQuantity?: number; // Available stock quantity
}

export interface Wishlist {
  userId: number;
  items: WishlistItem[];
  totalItems: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistItemCreate {
  productId: number;
}

export interface WishlistResponse {
  userId: number;
  items: WishlistItem[];
  totalItems: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Wishlist search response interface for admin search
 */
export interface WishlistSearchResponse {
  wishlists: Wishlist[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
