import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CartItemUpdateRequest {
  quantity: number;
}

export interface CartItemAddRequest {
  productId: number;
  quantity: number;
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
export class AdminCartService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  /**
   * Add an item to a user's cart
   */
  addItemToCart(userId: number, payload: CartItemAddRequest): Observable<ApiSuccessResponse> {
    const url = `${this.baseUrl}/api/admin/users/${userId}/cart/items`;
    return this.http.post<ApiSuccessResponse>(url, payload);
  }

  /**
   * Update quantity of an item in a user's cart
   */
  updateCartItemQuantity(userId: number, productId: number, quantity: number): Observable<ApiSuccessResponse> {
    const url = `${this.baseUrl}/api/admin/users/${userId}/cart/items/${productId}`;
    const payload: CartItemUpdateRequest = { quantity };
    
    return this.http.put<ApiSuccessResponse>(url, payload);
  }

  /**
   * Remove an item from a user's cart
   */
  removeCartItem(userId: number, productId: number): Observable<ApiSuccessResponse> {
    const url = `${this.baseUrl}/api/admin/users/${userId}/cart/items/${productId}`;
    return this.http.delete<ApiSuccessResponse>(url);
  }

  /**
   * Clear all items from a user's cart
   */
  clearUserCart(userId: number): Observable<ApiSuccessResponse> {
    const url = `${this.baseUrl}/api/admin/users/${userId}/cart`;
    return this.http.delete<ApiSuccessResponse>(url);
  }
}
