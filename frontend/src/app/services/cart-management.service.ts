import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CartItem, CartItemCreate, CartItemUpdate } from '../models/cart.model';
import { ApiMessage } from '../models/apiMessage.model';

/**
 * Admin Cart Management Service
 * Handles admin operations on user carts using /users/{userId}/cart endpoints
 */
@Injectable({
  providedIn: 'root'
})
export class CartManagementService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all user carts with pagination and search
   */
  getUserCarts(params: {
    skip?: number;
    limit?: number;
    search?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Observable<UserCartSearchResponse> {
    let httpParams = new HttpParams();
    
    if (params.skip !== undefined) httpParams = httpParams.set('skip', params.skip.toString());
    if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sortField) httpParams = httpParams.set('sortField', params.sortField);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);

    return this.http.get<UserCartSearchResponse>(`${this.apiUrl}/api/admin/users/carts`, { params: httpParams });
  }

  /**
   * Get specific user's cart
   */
  getUserCart(userId: number): Observable<UserCartWithDetails> {
    return this.http.get<UserCartWithDetails>(`${this.apiUrl}/api/admin/users/${userId}/cart`);
  }

  /**
   * Add item to user's cart
   */
  addItemToUserCart(userId: number, item: CartItemCreate): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.apiUrl}/api/admin/users/${userId}/cart/items`, item);
  }

  /**
   * Update cart item quantity
   */
  updateUserCartItem(userId: number, productId: number, update: CartItemUpdate): Observable<ApiMessage> {
    return this.http.put<ApiMessage>(`${this.apiUrl}/api/admin/users/${userId}/cart/items/${productId}`, update);
  }

  /**
   * Remove item from user's cart
   */
  removeItemFromUserCart(userId: number, productId: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.apiUrl}/api/admin/users/${userId}/cart/items/${productId}`);
  }

  /**
   * Clear user's entire cart
   */
  clearUserCart(userId: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.apiUrl}/api/admin/users/${userId}/cart`);
  }

  /**
   * Bulk clear multiple user carts
   */
  bulkClearUserCarts(userIds: number[]): Observable<ApiMessage> {
    return this.http.request<ApiMessage>('DELETE', `${this.apiUrl}/api/admin/users/carts/bulk`, {
      body: userIds
    });
  }
}

/**
 * User Cart Summary for admin table display
 */
export interface UserCartSummary {
  userId: number;
  username: string;
  email: string;
  totalItems: number;
  totalValue: number;
  lastUpdated: Date;
  hasItems: boolean;
}

/**
 * User Cart with detailed items for admin management
 */
export interface UserCartWithDetails extends UserCartSummary {
  items: CartItemWithProductDetails[];
}

/**
 * Cart item with product details for admin display
 */
export interface CartItemWithProductDetails extends CartItem {
  productName: string;
  productPrice: number;
  productCode?: string;
  productInternalReference?: string;
}

/**
 * Search response for user carts
 */
export interface UserCartSearchResponse {
  carts: UserCartSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
