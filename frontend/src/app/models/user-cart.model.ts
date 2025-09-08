/**
 * Admin User Cart Models
 * Models for the flattened cart structure with user information
 */

/**
 * Individual cart item with product details
 */
export interface AdminUserCartItem {
  productId: number;
  productName: string;
  quantity: number;
  productPrice: number;
  productStockQuantity: number;
}

/**
 * Flattened cart data structure with user information
 */
export interface AdminUserCartData {
  id: number;
  username: string;
  email: string;
  firstname: string | null;
  isActive: boolean;
  cart: AdminUserCartItem[];
  cartTotalValue: number;
}

/**
 * Response structure for admin user cart search
 */
export interface AdminUserCartListResponse {
  items: AdminUserCartData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Search parameters for admin user cart search
 */
export interface AdminUserCartSearchParams {
  page: number;
  limit: number;
  filters: Record<string, any>;
  sorts: Array<{ field: string; direction: 'asc' | 'desc' }>;
}
