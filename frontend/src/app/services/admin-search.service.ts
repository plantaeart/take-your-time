import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProductListResponse } from '../models/product.model';
import { UserListResponse } from '../models/user.model';
import { ContactSubmissionsResponse } from '../models/contact.model';
import { AdminSearchParams, CartSearchResponse, WishlistSearchResponse } from '../models/adminSearch.model';
import { AdminUserCartListResponse, AdminUserCartSearchParams } from '../models/user-cart.model';
import { AdminUserWishlistListResponse, AdminUserWishlistSearchParams } from '../models/user-wishlist.model';

/**
 * Unified Admin Search Service
 * Handles advanced search for all admin-managed entities
 */
@Injectable({
  providedIn: 'root'
})
export class AdminSearchService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Search products with advanced filtering and sorting
   */
  searchProducts(params: AdminSearchParams): Observable<ProductListResponse> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<ProductListResponse>(`${this.apiUrl}/api/admin/products/search`, { params: httpParams });
  }

  /**
   * Search users with advanced filtering and sorting
   */
  searchUsers(params: AdminSearchParams): Observable<UserListResponse> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<UserListResponse>(`${this.apiUrl}/api/admin/users/search`, { params: httpParams });
  }

  /**
   * Search contacts with advanced filtering and sorting
   */
  searchContacts(params: AdminSearchParams): Observable<ContactSubmissionsResponse> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<ContactSubmissionsResponse>(`${this.apiUrl}/api/admin/contacts/search`, { params: httpParams });
  }

  /**
   * Search carts with advanced filtering and sorting
   * Uses the new flattened cart structure with user information
   */
  searchCarts(params: AdminSearchParams): Observable<AdminUserCartListResponse> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<AdminUserCartListResponse>(`${this.apiUrl}/api/admin/cart/search`, { params: httpParams });
  }

  /**
   * Search user carts with flattened structure (alternative method name for clarity)
   */
  searchUserCarts(params: AdminUserCartSearchParams): Observable<AdminUserCartListResponse> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<AdminUserCartListResponse>(`${this.apiUrl}/api/admin/cart/search`, { params: httpParams });
  }

  /**
   * Search wishlists with advanced filtering and sorting
   */
  searchWishlists(params: AdminSearchParams): Observable<AdminUserWishlistListResponse> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<AdminUserWishlistListResponse>(`${this.apiUrl}/api/admin/wishlist/search`, { params: httpParams });
  }

  /**
   * Search user wishlists with flattened structure (alternative method name for clarity)
   */
  searchUserWishlists(params: AdminUserWishlistSearchParams): Observable<AdminUserWishlistListResponse> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<AdminUserWishlistListResponse>(`${this.apiUrl}/api/admin/wishlist/search`, { params: httpParams });
  }

  /**
   * Convert TypeScript objects to HTTP parameters with JSON strings
   */
  private buildHttpParams(params: AdminSearchParams): HttpParams {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());

    // Convert filters object to JSON string
    if (params.filters && Object.keys(params.filters).length > 0) {
      httpParams = httpParams.set('filters', JSON.stringify(params.filters));
    }

    // Convert sorts array to JSON string
    if (params.sorts && params.sorts.length > 0) {
      httpParams = httpParams.set('sorts', JSON.stringify(params.sorts));
    }

    return httpParams;
  }

  /**
   * Helper method to build filters from column configuration
   */
  static buildFiltersFromTabManagement(columnFilters: Record<string, any>, globalFilterValue: string, globalFilterFields: string[]): Record<string, any> {
    const filters: Record<string, any> = {};

    // Add column-specific filters
    Object.entries(columnFilters).forEach(([field, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Handle different filter types
        if (Array.isArray(value) && value.length === 2) {
          // Range filter (e.g., price range, date range)
          filters[field] = value;
        } else if (typeof value === 'string' && value.trim() !== '') {
          // Text filter
          filters[field] = value.trim();
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          // Number or boolean filter
          filters[field] = value;
        }
      }
    });

    // Add global search filter
    if (globalFilterValue && globalFilterValue.trim() !== '') {
      // For global search, we'll use a special filter structure
      // that the backend can interpret across multiple fields
      filters._globalSearch = {
        value: globalFilterValue.trim(),
        fields: globalFilterFields
      };
    }

    return filters;
  }

  /**
   * Helper method to build sorts from tab management sort state
   */
  static buildSortsFromTabManagement(sortField: string, sortOrder: 'asc' | 'desc'): Array<{ field: string; direction: 'asc' | 'desc' }> {
    if (!sortField || !sortOrder) {
      return [];
    }

    return [{ field: sortField, direction: sortOrder }];
  }
}
