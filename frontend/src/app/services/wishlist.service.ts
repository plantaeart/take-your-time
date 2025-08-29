import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Wishlist, WishlistItemCreate } from 'app/models/wishlist.model';
import { ApiMessage } from 'app/models/apiMessage.model';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get user's wishlist
   */
  getWishlist(): Observable<Wishlist> {
    return this.http.get<Wishlist>(`${this.apiUrl}/api/wishlist`);
  }

  /**
   * Add item to wishlist
   */
  addToWishlist(item: WishlistItemCreate): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.apiUrl}/api/wishlist/items`, item);
  }

  /**
   * Remove item from wishlist
   */
  removeFromWishlist(productId: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.apiUrl}/api/wishlist/items/${productId}`);
  }

  /**
   * Clear entire wishlist
   */
  clearWishlist(): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.apiUrl}/api/wishlist`);
  }
}
