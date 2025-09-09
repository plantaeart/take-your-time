/**
 * Admin User Wishlist Models
 * Models for the flattened wishlist structure with user information
 */

/**
 * Individual wishlist item with product details
 */
export interface AdminUserWishlistItem {
  productId: number;
  productName: string;
  productPrice: number;
  productStockQuantity: number;
  addedAt: string;
}

/**
 * Flattened wishlist data structure with user information
 */
export interface AdminUserWishlistData {
  id: number;
  username: string;
  email: string;
  firstname: string | null;
  isActive: boolean;
  wishlist: AdminUserWishlistItem[];
  wishlistItemCount: number;
}

/**
 * Response structure for admin user wishlist search
 */
export interface AdminUserWishlistListResponse {
  items: AdminUserWishlistData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Search parameters for admin user wishlist search
 */
export interface AdminUserWishlistSearchParams {
  page: number;
  limit: number;
  filters: Record<string, any>;
  sorts: Array<{ field: string; direction: 'asc' | 'desc' }>;
}
