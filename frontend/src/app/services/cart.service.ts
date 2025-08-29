import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cart, CartItemCreate, CartItemUpdate } from '../models/cart.model';
import { ApiMessage } from 'app/models/apiMessage.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get user's cart
   */
  getCart(): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/api/cart`);
  }

  /**
   * Add item to cart
   */
  addToCart(item: CartItemCreate): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.apiUrl}/api/cart/items`, item);
  }

  /**
   * Update cart item quantity
   */
  updateCartItem(productId: number, update: CartItemUpdate): Observable<ApiMessage> {
    return this.http.put<ApiMessage>(`${this.apiUrl}/api/cart/items/${productId}`, update);
  }

  /**
   * Remove item from cart
   */
  removeFromCart(productId: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.apiUrl}/api/cart/items/${productId}`);
  }

  /**
   * Clear entire cart
   */
  clearCart(): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.apiUrl}/api/cart`);
  }
}
