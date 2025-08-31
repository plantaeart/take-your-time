/**
 * Admin Search Models and Interfaces
 * Centralized models for admin search functionality across all entities
 */

/**
 * Search parameters for admin search endpoints
 */
export interface AdminSearchParams {
  page: number;
  limit: number;
  filters: Record<string, any>;
  sorts: Array<{ field: string; direction: 'asc' | 'desc' }>;
}

/**
 * Cart search response interface for admin search
 */
export interface CartSearchResponse {
  carts: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Wishlist search response interface for admin search
 */
export interface WishlistSearchResponse {
  wishlists: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Generic admin search response structure
 */
export interface AdminSearchResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Filter types supported by admin search
 */
export type AdminFilterType = 
  | 'text'
  | 'number'
  | 'range'
  | 'dropdown'
  | 'boolean'
  | 'date'
  | 'dateRange';

/**
 * Sort direction for admin search
 */
export type AdminSortDirection = 'asc' | 'desc';

/**
 * Sort configuration for admin search
 */
export interface AdminSort {
  field: string;
  direction: AdminSortDirection;
}

/**
 * Filter configuration for admin search
 */
export interface AdminFilter {
  field: string;
  value: any;
  type: AdminFilterType;
}
