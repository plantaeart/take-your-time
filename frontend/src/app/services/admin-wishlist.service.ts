import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WishlistItemAddRequest {
  productId: number;
}

export interface WishlistItemUpdateRequest {
  productId: number;
}

export interface ApiSuccessResponse {
  message: string;
  success?: boolean; // Optional since backend doesn't always include it
  error?: string;    // Optional error field
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AdminWishlistService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  /**
   * Add an item to a user's wishlist
   */
  addItemToWishlist(userId: number, payload: WishlistItemAddRequest): Observable<ApiSuccessResponse> {
    const url = `${this.baseUrl}/api/admin/users/${userId}/wishlist/items`;
    return this.http.post<ApiSuccessResponse>(url, payload);
  }

  /**
   * Update an item in a user's wishlist (change product)
   */
  updateWishlistItem(userId: number, originalProductId: number, payload: WishlistItemUpdateRequest): Observable<ApiSuccessResponse> {
    const url = `${this.baseUrl}/api/admin/users/${userId}/wishlist/items/${originalProductId}`;
    return this.http.put<ApiSuccessResponse>(url, payload);
  }

  /**
   * Remove an item from a user's wishlist
   */
  removeWishlistItem(userId: number, productId: number): Observable<ApiSuccessResponse> {
    const url = `${this.baseUrl}/api/admin/users/${userId}/wishlist/items/${productId}`;
    return this.http.delete<ApiSuccessResponse>(url);
  }

  /**
   * Clear all items from a user's wishlist
   */
  clearUserWishlist(userId: number): Observable<ApiSuccessResponse> {
    const url = `${this.baseUrl}/api/admin/users/${userId}/wishlist`;
    return this.http.delete<ApiSuccessResponse>(url);
  }
}
