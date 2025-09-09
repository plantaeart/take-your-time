import { Injectable, signal, computed, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { 
  WishlistManagementService, 
  UserWishlistSummary, 
  UserWishlistWithDetails, 
  UserWishlistSearchResponse 
} from '../services/wishlist-management.service';
import { WishlistItemCreate } from '../models/wishlist.model';

/**
 * Wishlist Management Store
 * Handles state for admin user wishlist CRUD operations
 */
@Injectable({
  providedIn: 'root'
})
export class WishlistManagementStore {
  private wishlistManagementService = inject(WishlistManagementService);
  private messageService = inject(MessageService);

  // State signals
  private _wishlists = signal<UserWishlistSummary[]>([]);
  private _selectedWishlistDetails = signal<UserWishlistWithDetails | null>(null);
  private _isLoading = signal<boolean>(false);
  private _isUpdating = signal<boolean>(false);
  private _isDeleting = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _lastOperation = signal<{
    type: 'add' | 'delete' | 'clear' | 'bulk-clear' | null;
    userId?: number;
    productId?: number;
    timestamp?: Date;
  }>({ type: null });

  // Public readonly state
  readonly wishlists = this._wishlists.asReadonly();
  readonly selectedWishlistDetails = this._selectedWishlistDetails.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isUpdating = this._isUpdating.asReadonly();
  readonly isDeleting = this._isDeleting.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastOperation = this._lastOperation.asReadonly();

  // Computed states
  readonly isAnyOperationInProgress = computed(() => 
    this._isLoading() || this._isUpdating() || this._isDeleting()
  );
  
  readonly totalWishlists = computed(() => this._wishlists().length);
  
  readonly wishlistsWithItems = computed(() => 
    this._wishlists().filter(wishlist => wishlist.itemCount > 0)
  );
  
  readonly emptyWishlists = computed(() => 
    this._wishlists().filter(wishlist => wishlist.itemCount === 0)
  );

  /**
   * Load user wishlists with optional filtering and pagination
   */
  async loadUserWishlists(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.wishlistManagementService.searchUserWishlists(params)
      );
      
      this._wishlists.set(response.items);
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to load user wishlists';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error', 
        summary: 'Load Error', 
        detail: errorMessage
      });
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Load detailed wishlist information for a specific user
   */
  async loadUserWishlistDetails(userId: number): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.wishlistManagementService.getUserWishlistDetails(userId)
      );
      
      this._selectedWishlistDetails.set(response);
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to load wishlist details';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error', 
        summary: 'Load Error', 
        detail: errorMessage
      });
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Add item to user's wishlist
   */
  async addItemToUserWishlist(userId: number, item: WishlistItemCreate): Promise<boolean> {
    this._isUpdating.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(
        this.wishlistManagementService.addItemToWishlist(userId, item)
      );

      this._lastOperation.set({
        type: 'add',
        userId,
        productId: item.productId,
        timestamp: new Date()
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Item added to wishlist successfully'
      });

      // Refresh data to show updated state
      await this.loadUserWishlists();
      return true;
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to add item to wishlist';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error',
        summary: 'Add Error',
        detail: errorMessage
      });
      return false;
    } finally {
      this._isUpdating.set(false);
    }
  }

  /**
   * Remove item from user's wishlist
   */
  async removeItemFromUserWishlist(userId: number, productId: number): Promise<boolean> {
    this._isDeleting.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(
        this.wishlistManagementService.removeItemFromWishlist(userId, productId)
      );

      this._lastOperation.set({
        type: 'delete',
        userId,
        productId,
        timestamp: new Date()
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Item removed from wishlist successfully'
      });

      // Refresh data to show updated state
      await this.loadUserWishlists();
      return true;
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to remove item from wishlist';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error',
        summary: 'Remove Error',
        detail: errorMessage
      });
      return false;
    } finally {
      this._isDeleting.set(false);
    }
  }

  /**
   * Clear all items from user's wishlist
   */
  async clearUserWishlist(userId: number): Promise<boolean> {
    this._isDeleting.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(
        this.wishlistManagementService.clearUserWishlist(userId)
      );

      this._lastOperation.set({
        type: 'clear',
        userId,
        timestamp: new Date()
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'User wishlist cleared successfully'
      });

      // Refresh data to show updated state
      await this.loadUserWishlists();
      return true;
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to clear user wishlist';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error',
        summary: 'Clear Error',
        detail: errorMessage
      });
      return false;
    } finally {
      this._isDeleting.set(false);
    }
  }

  /**
   * Clear multiple users' wishlists
   */
  async bulkClearUserWishlists(userIds: number[]): Promise<boolean> {
    this._isDeleting.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(
        this.wishlistManagementService.bulkClearUserWishlists(userIds)
      );

      this._lastOperation.set({
        type: 'bulk-clear',
        timestamp: new Date()
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${userIds.length} user wishlists cleared successfully`
      });

      // Refresh data to show updated state
      await this.loadUserWishlists();
      return true;
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to clear user wishlists';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error',
        summary: 'Bulk Clear Error',
        detail: errorMessage
      });
      return false;
    } finally {
      this._isDeleting.set(false);
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Clear last operation state
   */
  clearLastOperation(): void {
    this._lastOperation.set({ type: null });
  }
}
