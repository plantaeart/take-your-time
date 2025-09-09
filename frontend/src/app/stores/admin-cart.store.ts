import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AdminCartService, ApiSuccessResponse, CartItemAddRequest } from '../services/admin-cart.service';

@Injectable({
  providedIn: 'root'
})
export class AdminCartStore {
  private adminCartService = inject(AdminCartService);

  // State signals
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _lastUpdatedUserId = signal<number | null>(null);
  private _lastUpdatedProductId = signal<number | null>(null);

  // Readonly state
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastUpdatedUserId = this._lastUpdatedUserId.asReadonly();
  readonly lastUpdatedProductId = this._lastUpdatedProductId.asReadonly();

  /**
   * Add an item to a user's cart
   */
  async addItemToCart(userId: number, payload: CartItemAddRequest): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(this.adminCartService.addItemToCart(userId, payload));
      
      // Backend returns {message: '...'} without success property
      // Check for successful response by presence of message and no error
      if (response?.message && !response?.error) {
        this._lastUpdatedUserId.set(userId);
        this._lastUpdatedProductId.set(payload.productId);
        return true;
      } else {
        this._error.set('Failed to add item to cart');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error?.error?.detail || error?.message || 'Failed to add item to cart';
      this._error.set(errorMessage);
      console.error('Cart add error:', error);
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Update quantity of an item in a user's cart
   */
  async updateCartItemQuantity(userId: number, productId: number, quantity: number): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(this.adminCartService.updateCartItemQuantity(userId, productId, quantity));
      
      // Backend returns {message: '...'} without success property
      // Check for successful response by presence of message and no error
      if (response?.message && !response?.error) {
        this._lastUpdatedUserId.set(userId);
        this._lastUpdatedProductId.set(productId);
        return true;
      } else {
        this._error.set('Failed to update cart item quantity');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error?.error?.detail || error?.message || 'Failed to update cart item quantity';
      this._error.set(errorMessage);
      console.error('Cart update error:', error);
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Update cart item (supports both quantity and product changes)
   */
  async updateCartItem(userId: number, oldProductId: number, update: { productId?: number; quantity: number }): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(this.adminCartService.updateCartItem(userId, oldProductId, update));
      
      // Backend returns {message: '...'} without success property
      // Check for successful response by presence of message and no error
      if (response?.message && !response?.error) {
        this._lastUpdatedUserId.set(userId);
        this._lastUpdatedProductId.set(update.productId || oldProductId);
        return true;
      } else {
        this._error.set('Failed to update cart item');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error?.error?.detail || error?.message || 'Failed to update cart item';
      this._error.set(errorMessage);
      console.error('Cart update error:', error);
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Remove an item from a user's cart
   */
  async removeCartItem(userId: number, productId: number): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(this.adminCartService.removeCartItem(userId, productId));
      
      // Backend returns {message: '...'} without success property
      if (response?.message && !response?.error) {
        this._lastUpdatedUserId.set(userId);
        this._lastUpdatedProductId.set(productId);
        return true;
      } else {
        this._error.set('Failed to remove cart item');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error?.error?.detail || error?.message || 'Failed to remove cart item';
      this._error.set(errorMessage);
      console.error('Cart remove error:', error);
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Clear all items from a user's cart
   */
  async clearUserCart(userId: number): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(this.adminCartService.clearUserCart(userId));      
      
      // Backend returns {message: '...'} without success property
      if (response?.message && !response?.error) {
        this._lastUpdatedUserId.set(userId);
        this._lastUpdatedProductId.set(null); // Clearing entire cart
        return true;
      } else {
        this._error.set('Failed to clear user cart');
        console.error('Clear cart failed:', response);
        return false;
      }
    } catch (error: any) {
      const errorMessage = error?.error?.detail || error?.message || 'Failed to clear user cart';
      this._error.set(errorMessage);
      console.error('Clear cart error:', error);
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Reset store state
   */
  reset(): void {
    this._isLoading.set(false);
    this._error.set(null);
    this._lastUpdatedUserId.set(null);
    this._lastUpdatedProductId.set(null);
  }
}
