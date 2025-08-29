import { Injectable, signal, computed } from '@angular/core';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { WishlistService } from '../services/wishlist.service';
import { AuthStore } from './auth.store';
import { Wishlist, WishlistItem, WishlistItemCreate } from '../models/wishlist.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WishlistStore {
  private _wishlist = signal<Wishlist | null>(null);
  private _isLoading = signal(false);
  private readonly WISHLIST_STORAGE_KEY = 'user_wishlist';
  private isInitializedFromStorage = false;

  // Public readonly signals
  wishlist = this._wishlist.asReadonly();
  isLoading = this._isLoading.asReadonly();

  // Computed signals
  wishlistItems = computed(() => this._wishlist()?.items ?? []);
  totalItems = computed(() => this._wishlist()?.totalItems ?? 0);
  isEmpty = computed(() => this.totalItems() === 0);

  constructor(
    private wishlistService: WishlistService,
    private messageService: MessageService,
    private authStore: AuthStore
  ) {
    // Don't initialize immediately to avoid circular dependency
    // Wishlist will be initialized when explicitly requested
  }

  /**
   * Initialize wishlist from localStorage on app startup
   */
  private initializeWishlistFromStorage(): void {
    // Prevent multiple initializations from localStorage
    if (this.isInitializedFromStorage || !this.authStore.isAuthenticated()) {
      return;
    }

    try {
      const userId = this.authStore.user()?.id;
      if (!userId) {
        return;
      }

      const storedWishlist = localStorage.getItem(`${this.WISHLIST_STORAGE_KEY}_${userId}`);
      if (storedWishlist) {
        const wishlistData = JSON.parse(storedWishlist);
        
        // Validate the stored wishlist data
        if (this.isValidWishlistData(wishlistData)) {
          this._wishlist.set(wishlistData);
          this.isInitializedFromStorage = true;
          
          if (environment.debug) {
            console.log('Wishlist restored from localStorage - items:', wishlistData.totalItems);
          }
        }
      } else {
        if (environment.debug) {
          console.log('No wishlist found in localStorage for user:', userId);
        }
      }
    } catch (error) {
      console.error('Error initializing wishlist from localStorage:', error);
      this.clearWishlistFromStorage();
    }
  }

  /**
   * Public method to initialize wishlist - call this after authentication is established
   */
  initializeWishlist(): void {
    if (environment.debug) {
      console.log('WishlistStore.initializeWishlist() called - isInitializedFromStorage:', this.isInitializedFromStorage);
    }
    this.initializeWishlistFromStorage();
  }

  /**
   * Save wishlist to localStorage
   */
  private saveWishlistToStorage(): void {
    const userId = this.authStore.user()?.id;
    const currentWishlist = this._wishlist();
    
    if (userId && currentWishlist) {
      try {
        localStorage.setItem(
          `${this.WISHLIST_STORAGE_KEY}_${userId}`,
          JSON.stringify(currentWishlist)
        );
        
        if (environment.debug) {
          console.log('Wishlist saved to localStorage - items:', currentWishlist.totalItems);
        }
      } catch (error) {
        console.error('Error saving wishlist to localStorage:', error);
      }
    }
  }

  /**
   * Clear wishlist from localStorage
   */
  private clearWishlistFromStorage(): void {
    const userId = this.authStore.user()?.id;
    if (userId) {
      try {
        localStorage.removeItem(`${this.WISHLIST_STORAGE_KEY}_${userId}`);
        
        if (environment.debug) {
          console.log('Wishlist cleared from localStorage');
        }
      } catch (error) {
        console.error('Error clearing wishlist from localStorage:', error);
      }
    }
  }

  /**
   * Validate wishlist data structure
   */
  private isValidWishlistData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.userId === 'number' &&
      Array.isArray(data.items) &&
      typeof data.totalItems === 'number' &&
      data.createdAt &&
      data.updatedAt
    );
  }

  /**
   * Load wishlist data from backend - only call this manually when needed
   */
  async loadWishlist(): Promise<void> {
    // Check if auth store is properly initialized to avoid circular dependency
    if (!this.authStore.isInitialized() || !this.authStore.isAuthenticated()) {
      this._wishlist.set(null);
      this.clearWishlistFromStorage();
      return;
    }

    // Initialize from localStorage first if wishlist is empty
    if (!this._wishlist()) {
      this.initializeWishlistFromStorage();
    }

    this._isLoading.set(true);
    try {
      const wishlist = await firstValueFrom(this.wishlistService.getWishlist());
      this._wishlist.set(wishlist);
      
      // Save to localStorage after successful load
      this.saveWishlistToStorage();
      
      if (environment.debug) {
        console.log('Wishlist loaded for user:', wishlist.userId, 'with', wishlist.totalItems, 'items');
      }
    } catch (error: any) {
      console.error('Failed to load wishlist:', error);
      
      // On error, check if we have cached data in localStorage
      const currentWishlist = this._wishlist();
      if (!currentWishlist) {
        // Set empty wishlist on error only if no cached data
        const emptyWishlist = {
          userId: this.authStore.user()?.id || 0,
          items: [],
          totalItems: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this._wishlist.set(emptyWishlist);
        this.saveWishlistToStorage();
      }
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Add item to wishlist
   */
  async addToWishlist(productId: number): Promise<boolean> {
    if (!this.authStore.isAuthenticated()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Login Required',
        detail: 'Please login to add items to wishlist'
      });
      return false;
    }

    // Check if item is already in wishlist
    if (this.isProductInWishlist(productId)) {
      this.messageService.add({
        severity: 'info',
        summary: 'Already in Wishlist',
        detail: 'This item is already in your wishlist'
      });
      return false;
    }

    // Store current wishlist state for rollback if needed
    const currentWishlist = this._wishlist();
    if (!currentWishlist) {
      return false;
    }

    // Optimistic update - add locally first
    const newItem: WishlistItem = {
      productId,
      addedAt: new Date()
    };

    const updatedItems = [...currentWishlist.items, newItem];
    const updatedWishlist = {
      ...currentWishlist,
      items: updatedItems,
      totalItems: updatedItems.length,
      updatedAt: new Date()
    };

    // Update local state immediately
    this._wishlist.set(updatedWishlist);
    this.saveWishlistToStorage();

    try {
      const itemData: WishlistItemCreate = { productId };
      await firstValueFrom(this.wishlistService.addToWishlist(itemData));
      
      this.messageService.add({
        severity: 'success',
        summary: 'Added to Wishlist',
        detail: 'Product added to wishlist successfully'
      });
      
      if (environment.debug) {
        console.log(`Added product ${productId} to wishlist`);
      }
      
      return true;
    } catch (error: any) {
      // Rollback to previous state on error
      this._wishlist.set(currentWishlist);
      this.saveWishlistToStorage();
      
      this.messageService.add({
        severity: 'error',
        summary: 'Add to Wishlist Failed',
        detail: error.error?.detail || 'Failed to add product to wishlist'
      });
      
      if (environment.debug) {
        console.error('Failed to add to wishlist:', error);
      }
      
      return false;
    }
  }

  /**
   * Remove item from wishlist
   */
  async removeFromWishlist(productId: number): Promise<boolean> {
    if (!this.authStore.isAuthenticated()) {
      return false;
    }

    // Store current wishlist state for rollback if needed
    const currentWishlist = this._wishlist();
    if (!currentWishlist) {
      return false;
    }

    // Optimistic update - remove locally first
    const updatedItems = currentWishlist.items.filter(item => item.productId !== productId);
    const updatedWishlist = {
      ...currentWishlist,
      items: updatedItems,
      totalItems: updatedItems.length,
      updatedAt: new Date()
    };

    // Update local state immediately
    this._wishlist.set(updatedWishlist);
    this.saveWishlistToStorage();

    try {
      await firstValueFrom(this.wishlistService.removeFromWishlist(productId));
      
      this.messageService.add({
        severity: 'success',
        summary: 'Item Removed',
        detail: 'Product removed from wishlist'
      });
      
      if (environment.debug) {
        console.log(`Removed product ${productId} from wishlist`);
      }
      
      return true;
    } catch (error: any) {
      // Rollback to previous state on error
      this._wishlist.set(currentWishlist);
      this.saveWishlistToStorage();
      
      this.messageService.add({
        severity: 'error',
        summary: 'Remove Failed',
        detail: error.error?.detail || 'Failed to remove item from wishlist'
      });
      
      if (environment.debug) {
        console.error('Failed to remove from wishlist:', error);
      }
      
      return false;
    }
  }

  /**
   * Clear entire wishlist
   */
  async clearWishlist(): Promise<boolean> {
    if (!this.authStore.isAuthenticated()) {
      return false;
    }

    // Store current wishlist state for rollback if needed
    const currentWishlist = this._wishlist();
    if (!currentWishlist) {
      return false;
    }

    // Optimistic update - clear locally first
    const emptyWishlist = {
      userId: currentWishlist.userId,
      items: [],
      totalItems: 0,
      createdAt: currentWishlist.createdAt,
      updatedAt: new Date()
    };

    // Update local state immediately
    this._wishlist.set(emptyWishlist);
    this.saveWishlistToStorage();

    try {
      await firstValueFrom(this.wishlistService.clearWishlist());
      
      this.messageService.add({
        severity: 'success',
        summary: 'Wishlist Cleared',
        detail: 'All items removed from wishlist'
      });
      
      if (environment.debug) {
        console.log('Wishlist cleared');
      }
      
      return true;
    } catch (error: any) {
      // Rollback to previous state on error
      this._wishlist.set(currentWishlist);
      this.saveWishlistToStorage();
      
      this.messageService.add({
        severity: 'error',
        summary: 'Clear Failed',
        detail: error.error?.detail || 'Failed to clear wishlist'
      });
      
      if (environment.debug) {
        console.error('Failed to clear wishlist:', error);
      }
      
      return false;
    }
  }

  /**
   * Get wishlist item by product ID
   */
  getWishlistItem(productId: number): WishlistItem | undefined {
    return this.wishlistItems().find(item => item.productId === productId);
  }

  /**
   * Check if product is in wishlist
   */
  isProductInWishlist(productId: number): boolean {
    return this.getWishlistItem(productId) !== undefined;
  }

  /**
   * Reset wishlist state (for logout)
   */
  resetWishlist(): void {
    this._wishlist.set(null);
    this._isLoading.set(false);
    this.isInitializedFromStorage = false;
    
    // Clear wishlist from localStorage when resetting
    this.clearWishlistFromStorage();
    
    if (environment.debug) {
      console.log('Wishlist state reset and cleared from localStorage');
    }
  }

  /**
   * Check if wishlist should be refreshed from database
   * Returns true if wishlist is empty or data is stale
   */
  shouldRefreshFromDatabase(): boolean {
    const wishlist = this._wishlist();
    if (!wishlist) {
      return true;
    }
    
    // Check if data is stale (older than 5 minutes)
    const now = new Date();
    const lastUpdate = new Date(wishlist.updatedAt);
    const timeDiff = now.getTime() - lastUpdate.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    return minutesDiff > 5;
  }

  /**
   * Refresh wishlist from database
   */
  async refreshWishlistFromDatabase(): Promise<void> {
    if (!this.authStore.isAuthenticated()) {
      return;
    }

    this._isLoading.set(true);
    try {
      const wishlist = await firstValueFrom(this.wishlistService.getWishlist());
      this._wishlist.set(wishlist);
      
      // Update localStorage with fresh data
      this.saveWishlistToStorage();
      
      if (environment.debug) {
        console.log('Wishlist refreshed from database - items:', wishlist.totalItems);
      }
    } catch (error: any) {
      console.error('Failed to refresh wishlist from database:', error);
      
      this.messageService.add({
        severity: 'error',
        summary: 'Wishlist Sync Failed',
        detail: 'Failed to sync wishlist with server'
      });
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Update wishlist items with additional product information
   */
  updateWishlistItemsWithProductData(updates: Array<{ 
    productId: number; 
    productName?: string;
    productPrice?: number;
    productImage?: string;
    productCategory?: string;
    productQuantity?: number;
  }>): void {
    const currentWishlist = this._wishlist();
    if (!currentWishlist) {
      return;
    }

    const updatedItems = currentWishlist.items.map(item => {
      const update = updates.find(u => u.productId === item.productId);
      if (update) {
        return { 
          ...item, 
          productName: update.productName,
          productPrice: update.productPrice,
          productImage: update.productImage,
          productCategory: update.productCategory,
          productQuantity: update.productQuantity
        };
      }
      return item;
    });

    const updatedWishlist = { ...currentWishlist, items: updatedItems };
    this._wishlist.set(updatedWishlist);
    
    // Update localStorage with enhanced data
    this.saveWishlistToStorage();
  }
}
