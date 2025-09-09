import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AdminWishlistService, ApiSuccessResponse, WishlistItemAddRequest, WishlistItemUpdateRequest } from '../services/admin-wishlist.service';

@Injectable({
  providedIn: 'root'
})
export class AdminWishlistStore {
  private adminWishlistService = inject(AdminWishlistService);

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
   * Add an item to a user's wishlist
   */
  async addItemToWishlist(userId: number, payload: WishlistItemAddRequest): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(this.adminWishlistService.addItemToWishlist(userId, payload));
      
      // Backend returns {message: '...'} without success property
      // Check for successful response by presence of message and no error
      if (response?.message && !response?.error) {
        this._lastUpdatedUserId.set(userId);
        this._lastUpdatedProductId.set(payload.productId);
        return true;
      } else {
        this._error.set('Failed to add item to wishlist');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error?.error?.detail || error?.message || 'Failed to add item to wishlist';
      this._error.set(errorMessage);
      console.error('Wishlist add error:', error);
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Update an item in a user's wishlist (change product)
   */
  async updateWishlistItem(userId: number, originalProductId: number, updateData: WishlistItemUpdateRequest): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(this.adminWishlistService.updateWishlistItem(userId, originalProductId, updateData));
      
      // Backend returns {message: '...'} without success property
      if (response?.message && !response?.error) {
        this._lastUpdatedUserId.set(userId);
        this._lastUpdatedProductId.set(updateData.productId);
        return true;
      } else {
        this._error.set('Failed to update wishlist item');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error?.error?.detail || error?.message || 'Failed to update wishlist item';
      this._error.set(errorMessage);
      console.error('Wishlist update error:', error);
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Remove an item from a user's wishlist
   */
  async removeWishlistItem(userId: number, productId: number): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(this.adminWishlistService.removeWishlistItem(userId, productId));
      
      // Backend returns {message: '...'} without success property
      if (response?.message && !response?.error) {
        this._lastUpdatedUserId.set(userId);
        this._lastUpdatedProductId.set(productId);
        return true;
      } else {
        this._error.set('Failed to remove wishlist item');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error?.error?.detail || error?.message || 'Failed to remove wishlist item';
      this._error.set(errorMessage);
      console.error('Wishlist remove error:', error);
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Clear all items from a user's wishlist
   */
  async clearUserWishlist(userId: number): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(this.adminWishlistService.clearUserWishlist(userId));      
      
      // Backend returns {message: '...'} without success property
      if (response?.message && !response?.error) {
        this._lastUpdatedUserId.set(userId);
        this._lastUpdatedProductId.set(null); // Clearing entire wishlist
        return true;
      } else {
        this._error.set('Failed to clear user wishlist');
        console.error('Clear wishlist failed:', response);
        return false;
      }
    } catch (error: any) {
      const errorMessage = error?.error?.detail || error?.message || 'Failed to clear user wishlist';
      this._error.set(errorMessage);
      console.error('Clear wishlist error:', error);
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
