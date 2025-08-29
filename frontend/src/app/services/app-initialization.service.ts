import { Injectable, effect } from '@angular/core';
import { AuthStore } from '../stores/auth.store';
import { CartStore } from '../stores/cart.store';
import { WishlistStore } from '../stores/wishlist.store';
import { environment } from '../../environments/environment';

/**
 * Service to handle app initialization and coordinate between stores
 * This prevents circular dependencies by managing the initialization flow
 */
@Injectable({
  providedIn: 'root'
})
export class AppInitializationService {
  private cartInitialized = false;
  private wishlistInitialized = false;
  
  constructor(
    private authStore: AuthStore,
    private cartStore: CartStore,
    private wishlistStore: WishlistStore
  ) {
    this.setupAuthCartSync();
  }

  /**
   * Setup effect to sync cart when auth state changes
   */
  private setupAuthCartSync(): void {
    // Use effect to watch for auth state changes
    effect(() => {
      const isAuthenticated = this.authStore.isAuthenticated();
      const isInitialized = this.authStore.isInitialized();
      
      if (environment.debug) {
        console.log('Auth state changed - authenticated:', isAuthenticated, 'initialized:', isInitialized, 'cartInitialized:', this.cartInitialized, 'wishlistInitialized:', this.wishlistInitialized);
      }
      
      if (isInitialized && isAuthenticated && !this.cartInitialized) {
        // Initialize cart when user is authenticated (only once)
        this.cartInitialized = true;
        // Small delay to ensure auth is fully settled
        setTimeout(async () => {
          try {
            await this.initializeUserCart();
          } catch (error) {
            console.error('Failed to initialize cart in effect:', error);
            this.cartInitialized = false; // Reset flag on error
          }
        }, 50);
      }
      
      if (isInitialized && isAuthenticated && !this.wishlistInitialized) {
        // Initialize wishlist when user is authenticated (only once)
        this.wishlistInitialized = true;
        // Small delay to ensure auth is fully settled
        setTimeout(async () => {
          try {
            await this.initializeUserWishlist();
          } catch (error) {
            console.error('Failed to initialize wishlist in effect:', error);
            this.wishlistInitialized = false; // Reset flag on error
          }
        }, 100); // Slightly different delay to spread the load
      } else if (isInitialized && !isAuthenticated) {
        // Clear cart and wishlist when user is not authenticated
        this.cartInitialized = false;
        this.wishlistInitialized = false;
        this.cartStore.resetCart();
        this.wishlistStore.resetWishlist();
      }
    }, { allowSignalWrites: true }); // Allow signal writes in this effect
  }

  /**
   * Initialize user cart after authentication
   */
  private async initializeUserCart(): Promise<void> {
    try {
      // First, try to initialize cart from localStorage
      this.cartStore.initializeCart();
      
      // If no cart data was found in localStorage, load from database
      if (this.cartStore.cartItems().length === 0) {
        if (environment.debug) {
          console.log('No cart found in localStorage, loading from database...');
        }
        await this.cartStore.loadCart();
      }
      
      if (environment.debug) {
        console.log('User cart initialization complete - items:', this.cartStore.cartItems().length);
      }
    } catch (error) {
      console.error('Failed to initialize user cart:', error);
    }
  }

  /**
   * Initialize user wishlist after authentication
   */
  private async initializeUserWishlist(): Promise<void> {
    try {
      // First, try to initialize wishlist from localStorage
      this.wishlistStore.initializeWishlist();
      
      // If no wishlist data was found in localStorage, load from database
      if (this.wishlistStore.wishlistItems().length === 0) {
        if (environment.debug) {
          console.log('No wishlist found in localStorage, loading from database...');
        }
        await this.wishlistStore.loadWishlist();
      }
      
      if (environment.debug) {
        console.log('User wishlist initialization complete - items:', this.wishlistStore.wishlistItems().length);
      }
    } catch (error) {
      console.error('Failed to initialize user wishlist:', error);
    }
  }

  /**
   * Manually trigger cart initialization (for use in components)
   */
  async initializeCart(): Promise<void> {
    if (this.authStore.isAuthenticated() && !this.cartInitialized) {
      this.cartInitialized = true;
      await this.initializeUserCart();
    }
  }

  /**
   * Manually trigger wishlist initialization (for use in components)
   */
  async initializeWishlist(): Promise<void> {
    if (this.authStore.isAuthenticated() && !this.wishlistInitialized) {
      this.wishlistInitialized = true;
      await this.initializeUserWishlist();
    }
  }
}
