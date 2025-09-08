import { Injectable, signal, computed, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { 
  CartManagementService, 
  UserCartSummary, 
  UserCartWithDetails, 
  UserCartSearchResponse 
} from '../services/cart-management.service';
import { CartItemCreate, CartItemUpdate } from '../models/cart.model';

/**
 * Cart Management Store
 * Handles state for admin user cart CRUD operations
 */
@Injectable({
  providedIn: 'root'
})
export class CartManagementStore {
  private cartManagementService = inject(CartManagementService);
  private messageService = inject(MessageService);

  // State signals
  private _carts = signal<UserCartSummary[]>([]);
  private _selectedCartDetails = signal<UserCartWithDetails | null>(null);
  private _isLoading = signal<boolean>(false);
  private _isUpdating = signal<boolean>(false);
  private _isDeleting = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _lastOperation = signal<{
    type: 'add' | 'update' | 'delete' | 'clear' | 'bulk-clear' | null;
    userId?: number;
    productId?: number;
    timestamp?: Date;
  }>({ type: null });

  // Public readonly state
  readonly carts = this._carts.asReadonly();
  readonly selectedCartDetails = this._selectedCartDetails.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isUpdating = this._isUpdating.asReadonly();
  readonly isDeleting = this._isDeleting.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastOperation = this._lastOperation.asReadonly();

  // Computed states
  readonly isAnyOperationInProgress = computed(() => 
    this._isLoading() || this._isUpdating() || this._isDeleting()
  );
  
  readonly totalCarts = computed(() => this._carts().length);
  readonly cartsWithItems = computed(() => this._carts().filter(cart => cart.hasItems));
  readonly emptyCarts = computed(() => this._carts().filter(cart => !cart.hasItems));

  /**
   * Load user carts with search and pagination
   */
  async loadUserCarts(params: {
    skip?: number;
    limit?: number;
    search?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<UserCartSearchResponse> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(this.cartManagementService.getUserCarts(params));
      this._carts.set(response.carts);
      return response;
    } catch (error: any) {
      this._error.set(error.message || 'Failed to load user carts');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Load detailed cart for specific user
   */
  async loadUserCartDetails(userId: number): Promise<UserCartWithDetails> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const cartDetails = await firstValueFrom(this.cartManagementService.getUserCart(userId));
      this._selectedCartDetails.set(cartDetails);
      return cartDetails;
    } catch (error: any) {
      this._error.set(error.message || 'Failed to load cart details');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Add item to user's cart
   */
  async addItemToUserCart(userId: number, item: CartItemCreate): Promise<void> {
    this._isUpdating.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(this.cartManagementService.addItemToUserCart(userId, item));
      
      this._lastOperation.set({
        type: 'add',
        userId,
        productId: item.productId,
        timestamp: new Date()
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Item Added',
        detail: 'Item successfully added to user cart'
      });

      // Refresh cart details if currently viewing this user's cart
      if (this._selectedCartDetails()?.userId === userId) {
        await this.loadUserCartDetails(userId);
      }
    } catch (error: any) {
      this._error.set(error.message || 'Failed to add item to cart');
      this.messageService.add({
        severity: 'error',
        summary: 'Add Failed',
        detail: error.message || 'Failed to add item to cart'
      });
      throw error;
    } finally {
      this._isUpdating.set(false);
    }
  }

  /**
   * Update cart item quantity
   */
  async updateUserCartItem(userId: number, productId: number, update: CartItemUpdate): Promise<void> {
    this._isUpdating.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(this.cartManagementService.updateUserCartItem(userId, productId, update));
      
      this._lastOperation.set({
        type: 'update',
        userId,
        productId,
        timestamp: new Date()
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Item Updated',
        detail: 'Cart item quantity updated successfully'
      });

      // Refresh cart details if currently viewing this user's cart
      if (this._selectedCartDetails()?.userId === userId) {
        await this.loadUserCartDetails(userId);
      }
    } catch (error: any) {
      this._error.set(error.message || 'Failed to update cart item');
      this.messageService.add({
        severity: 'error',
        summary: 'Update Failed',
        detail: error.message || 'Failed to update cart item'
      });
      throw error;
    } finally {
      this._isUpdating.set(false);
    }
  }

  /**
   * Remove item from user's cart
   */
  async removeItemFromUserCart(userId: number, productId: number): Promise<void> {
    this._isDeleting.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(this.cartManagementService.removeItemFromUserCart(userId, productId));
      
      this._lastOperation.set({
        type: 'delete',
        userId,
        productId,
        timestamp: new Date()
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Item Removed',
        detail: 'Item removed from cart successfully'
      });

      // Refresh cart details if currently viewing this user's cart
      if (this._selectedCartDetails()?.userId === userId) {
        await this.loadUserCartDetails(userId);
      }
    } catch (error: any) {
      this._error.set(error.message || 'Failed to remove cart item');
      this.messageService.add({
        severity: 'error',
        summary: 'Remove Failed',
        detail: error.message || 'Failed to remove cart item'
      });
      throw error;
    } finally {
      this._isDeleting.set(false);
    }
  }

  /**
   * Clear user's entire cart
   */
  async clearUserCart(userId: number): Promise<void> {
    this._isDeleting.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(this.cartManagementService.clearUserCart(userId));
      
      this._lastOperation.set({
        type: 'clear',
        userId,
        timestamp: new Date()
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Cart Cleared',
        detail: 'User cart cleared successfully'
      });

      // Refresh cart details if currently viewing this user's cart
      if (this._selectedCartDetails()?.userId === userId) {
        await this.loadUserCartDetails(userId);
      }
    } catch (error: any) {
      this._error.set(error.message || 'Failed to clear cart');
      this.messageService.add({
        severity: 'error',
        summary: 'Clear Failed',
        detail: error.message || 'Failed to clear cart'
      });
      throw error;
    } finally {
      this._isDeleting.set(false);
    }
  }

  /**
   * Bulk clear multiple user carts
   */
  async bulkClearUserCarts(userIds: number[]): Promise<void> {
    this._isDeleting.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(this.cartManagementService.bulkClearUserCarts(userIds));
      
      this._lastOperation.set({
        type: 'bulk-clear',
        timestamp: new Date()
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Carts Cleared',
        detail: `${userIds.length} user carts cleared successfully`
      });

      // Clear selected cart details if it was one of the cleared carts
      if (this._selectedCartDetails() && userIds.includes(this._selectedCartDetails()!.userId)) {
        this._selectedCartDetails.set(null);
      }
    } catch (error: any) {
      this._error.set(error.message || 'Failed to clear carts');
      this.messageService.add({
        severity: 'error',
        summary: 'Bulk Clear Failed',
        detail: error.message || 'Failed to clear selected carts'
      });
      throw error;
    } finally {
      this._isDeleting.set(false);
    }
  }

  /**
   * Clear selected cart details
   */
  clearSelectedCartDetails(): void {
    this._selectedCartDetails.set(null);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Reset all state
   */
  reset(): void {
    this._carts.set([]);
    this._selectedCartDetails.set(null);
    this._isLoading.set(false);
    this._isUpdating.set(false);
    this._isDeleting.set(false);
    this._error.set(null);
    this._lastOperation.set({ type: null });
  }
}
