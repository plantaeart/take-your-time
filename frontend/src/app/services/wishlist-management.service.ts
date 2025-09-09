import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WishlistItem, WishlistItemCreate } from '../models/wishlist.model';
import { ApiMessage } from '../models/apiMessage.model';

/**
 * Admin Wishlist Management Service
 * Handles admin operations on user wishlists using /users/{userId}/wishlist endpoints
 */
@Injectable({
  providedIn: 'root'
})
export class WishlistManagementService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all user wishlists with pagination and search
   */
  searchUserWishlists(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Observable<UserWishlistSearchResponse> {
    let httpParams = new HttpParams();
    
    // Use page instead of skip
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
    
    // Handle filters as JSON string
    const filters: any = {};
    if (params.search) filters.search = params.search;
    if (Object.keys(filters).length > 0) {
      httpParams = httpParams.set('filters', JSON.stringify(filters));
    }
    
    // Handle sorts as JSON string
    if (params.sortField && params.sortOrder) {
      const sorts = [{ field: params.sortField, direction: params.sortOrder }];
      httpParams = httpParams.set('sorts', JSON.stringify(sorts));
    }

    return this.http.get<UserWishlistSearchResponse>(`${this.apiUrl}/api/admin/wishlist/search`, { params: httpParams });
  }

  /**
   * Get specific user's wishlist
   */
  getUserWishlistDetails(userId: number): Observable<UserWishlistWithDetails> {
    return this.http.get<UserWishlistWithDetails>(`${this.apiUrl}/api/admin/users/${userId}/wishlist`);
  }

  /**
   * Add item to user's wishlist
   */
  addItemToWishlist(userId: number, item: WishlistItemCreate): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.apiUrl}/api/admin/users/${userId}/wishlist/items`, item);
  }

  /**
   * Remove item from user's wishlist
   */
  removeItemFromWishlist(userId: number, productId: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.apiUrl}/api/admin/users/${userId}/wishlist/items/${productId}`);
  }

  /**
   * Clear all items from user's wishlist
   */
  clearUserWishlist(userId: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.apiUrl}/api/admin/users/${userId}/wishlist`);
  }

  /**
   * Bulk clear multiple users' wishlists
   */
  bulkClearUserWishlists(userIds: number[]): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.apiUrl}/api/admin/users/wishlists/bulk-clear`, { userIds });
  }
}

/**
 * Interface for user wishlist summary in search results
 */
export interface UserWishlistSummary {
  userId: number;
  username: string;
  email: string;
  firstname?: string;
  itemCount: number;
  totalValue: number;
  lastUpdated: string;
}

/**
 * Interface for detailed user wishlist information
 */
export interface UserWishlistWithDetails {
  userId: number;
  username: string;
  email: string;
  firstname?: string;
  items: WishlistItem[];
  itemCount: number;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for user wishlist search response
 */
export interface UserWishlistSearchResponse {
  items: UserWishlistSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
