import { Injectable, signal, computed } from '@angular/core';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../services/cart.service';
import { AuthStore } from './auth.store';
import { Cart, CartItem, CartItemCreate, CartItemUpdate } from '../models/cart.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartStore {
  private _cart = signal<Cart | null>(null);
  private _isLoading = signal(false);
  private readonly CART_STORAGE_KEY = 'user_cart';
  private isInitializedFromStorage = false;

  // Public readonly signals
  cart = this._cart.asReadonly();
  isLoading = this._isLoading.asReadonly();

  // Computed signals
  cartItems = computed(() => this._cart()?.items ?? []);
  totalItems = computed(() => this._cart()?.totalItems ?? 0);
  isEmpty = computed(() => this.totalItems() === 0);

  constructor(
    private cartService: CartService,
    private messageService: MessageService,
    private authStore: AuthStore
  ) {
    // Don't initialize immediately to avoid circular dependency
    // Cart will be initialized when explicitly requested
  }

  /**
   * Initialize cart from localStorage on app startup
   */
  private initializeCartFromStorage(): void {
    // Prevent multiple initializations from localStorage
    if (this.isInitializedFromStorage || !this.authStore.isAuthenticated()) {
      return;
    }

    try {
      const userId = this.authStore.user()?.id;
      if (!userId) {
        return;
      }

      const storedCart = localStorage.getItem(`${this.CART_STORAGE_KEY}_${userId}`);
      if (storedCart) {
        const cartData = JSON.parse(storedCart);
        
        // Validate the stored cart data
        if (this.isValidCartData(cartData)) {
          this._cart.set(cartData);
          this.isInitializedFromStorage = true;
          
          if (environment.debug) {
            console.log('Cart restored from localStorage - items:', cartData.totalItems);
          }
        }
      } else {
        if (environment.debug) {
          console.log('No cart found in localStorage for user:', userId);
        }
      }
    } catch (error) {
      console.error('Error initializing cart from localStorage:', error);
      this.clearCartFromStorage();
    }
  }

  /**
   * Public method to initialize cart - call this after authentication is established
   */
  initializeCart(): void {
    if (environment.debug) {
      console.log('CartStore.initializeCart() called - isInitializedFromStorage:', this.isInitializedFromStorage);
    }
    this.initializeCartFromStorage();
  }

  /**
   * Save cart to localStorage
   */
  private saveCartToStorage(): void {
    const userId = this.authStore.user()?.id;
    const currentCart = this._cart();
    
    if (userId && currentCart) {
      try {
        localStorage.setItem(
          `${this.CART_STORAGE_KEY}_${userId}`,
          JSON.stringify(currentCart)
        );
        
        if (environment.debug) {
          console.log('Cart saved to localStorage - items:', currentCart.totalItems);
        }
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }

  /**
   * Clear cart from localStorage
   */
  private clearCartFromStorage(): void {
    const userId = this.authStore.user()?.id;
    if (userId) {
      try {
        localStorage.removeItem(`${this.CART_STORAGE_KEY}_${userId}`);
        
        if (environment.debug) {
          console.log('Cart cleared from localStorage');
        }
      } catch (error) {
        console.error('Error clearing cart from localStorage:', error);
      }
    }
  }

  /**
   * Validate cart data structure
   */
  private isValidCartData(data: any): boolean {
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
   * Load cart data from backend - only call this manually when needed
   */
  async loadCart(): Promise<void> {
    // Check if auth store is properly initialized to avoid circular dependency
    if (!this.authStore.isInitialized() || !this.authStore.isAuthenticated()) {
      this._cart.set(null);
      this.clearCartFromStorage();
      return;
    }

    // Initialize from localStorage first if cart is empty
    if (!this._cart()) {
      this.initializeCartFromStorage();
    }

    this._isLoading.set(true);
    try {
      const cart = await firstValueFrom(this.cartService.getCart());
      this._cart.set(cart);
      
      // Save to localStorage after successful load
      this.saveCartToStorage();
      
      if (environment.debug) {
        console.log('Cart loaded for user:', cart.userId, 'with', cart.totalItems, 'items');
      }
    } catch (error: any) {
      console.error('Failed to load cart:', error);
      
      // On error, check if we have cached data in localStorage
      const currentCart = this._cart();
      if (!currentCart) {
        // Set empty cart on error only if no cached data
        const emptyCart = {
          userId: this.authStore.user()?.id || 0,
          items: [],
          totalItems: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this._cart.set(emptyCart);
        this.saveCartToStorage();
      }
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Add item to cart
   */
  async addToCart(productId: number, quantity: number = 1): Promise<boolean> {
    if (!this.authStore.isAuthenticated()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Login Required',
        detail: 'Please login to add items to cart'
      });
      return false;
    }
    
    this._isLoading.set(true);
    try {
      const itemData: CartItemCreate = { productId, quantity };
      await firstValueFrom(this.cartService.addToCart(itemData));
      
      // Reload cart to get updated data
      await this.loadCart();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Added to Cart',
        detail: `Product added to cart successfully`
      });
      
      if (environment.debug) {
        console.log(`Added product ${productId} (qty: ${quantity}) to cart`);
      }
      
      return true;
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Add to Cart Failed',
        detail: error.error?.detail || 'Failed to add product to cart'
      });
      
      if (environment.debug) {
        console.error('Failed to add to cart:', error);
      }
      
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(productId: number, quantity: number): Promise<boolean> {
    if (!this.authStore.isAuthenticated()) {
      return false;
    }

    // Store current cart state for rollback if needed
    const currentCart = this._cart();
    if (!currentCart) {
      return false;
    }

    // Optimistic update - update locally first
    const updatedItems = currentCart.items.map(item => 
      item.productId === productId 
        ? { 
            ...item, 
            quantity, 
            updatedAt: new Date(),
            // Preserve all existing fields including productQuantity
            productName: item.productName,
            productPrice: item.productPrice,
            productImage: item.productImage,
            productQuantity: item.productQuantity
          }
        : item
    );

    const updatedCart = {
      ...currentCart,
      items: updatedItems,
      totalItems: updatedItems.reduce((total, item) => total + item.quantity, 0),
      updatedAt: new Date()
    };

    // Update local state immediately
    this._cart.set(updatedCart);
    this.saveCartToStorage();

    try {
      const updateData: CartItemUpdate = { quantity };
      await firstValueFrom(this.cartService.updateCartItem(productId, updateData));
      
      // No need to reload cart - optimistic update was successful
      this.messageService.add({
        severity: 'success',
        summary: 'Cart Updated',
        detail: 'Cart item updated successfully'
      });
      
      if (environment.debug) {
        console.log(`Updated product ${productId} quantity to ${quantity}`);
      }
      
      return true;
    } catch (error: any) {
      // Rollback to previous state on error
      this._cart.set(currentCart);
      this.saveCartToStorage();
      
      this.messageService.add({
        severity: 'error',
        summary: 'Update Failed',
        detail: error.error?.detail || 'Failed to update cart item'
      });
      
      if (environment.debug) {
        console.error('Failed to update cart item:', error);
      }
      
      return false;
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(productId: number): Promise<boolean> {
    if (!this.authStore.isAuthenticated()) {
      return false;
    }

    this._isLoading.set(true);
    try {
      await firstValueFrom(this.cartService.removeFromCart(productId));
      
      // Reload cart to get updated data
      await this.loadCart();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Item Removed',
        detail: 'Product removed from cart'
      });
      
      if (environment.debug) {
        console.log(`Removed product ${productId} from cart`);
      }
      
      return true;
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Remove Failed',
        detail: error.error?.detail || 'Failed to remove item from cart'
      });
      
      if (environment.debug) {
        console.error('Failed to remove from cart:', error);
      }
      
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<boolean> {
    if (!this.authStore.isAuthenticated()) {
      return false;
    }

    this._isLoading.set(true);
    try {
      await firstValueFrom(this.cartService.clearCart());
      
      // Reload cart to get updated data
      await this.loadCart();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Cart Cleared',
        detail: 'All items removed from cart'
      });
      
      if (environment.debug) {
        console.log('Cart cleared');
      }
      
      return true;
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Clear Failed',
        detail: error.error?.detail || 'Failed to clear cart'
      });
      
      if (environment.debug) {
        console.error('Failed to clear cart:', error);
      }
      
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Get cart item by product ID
   */
  getCartItem(productId: number): CartItem | undefined {
    return this.cartItems().find(item => item.productId === productId);
  }

  /**
   * Check if product is in cart
   */
  isProductInCart(productId: number): boolean {
    return this.getCartItem(productId) !== undefined;
  }

  /**
   * Get quantity of specific product in cart
   */
  getProductQuantityInCart(productId: number): number {
    return this.getCartItem(productId)?.quantity ?? 0;
  }

  /**
   * Reset cart state (for logout)
   */
  resetCart(): void {
    this._cart.set(null);
    this._isLoading.set(false);
    this.isInitializedFromStorage = false;
    
    // Clear cart from localStorage when resetting
    this.clearCartFromStorage();
    
    if (environment.debug) {
      console.log('Cart state reset and cleared from localStorage');
    }
  }

  /**
   * Check if cart should be refreshed from database
   * Returns true if cart is empty or data is stale
   */
  shouldRefreshFromDatabase(): boolean {
    const cart = this._cart();
    if (!cart || cart.items.length === 0) {
      return true;
    }
    
    // Check if cart data is older than 5 minutes
    const cartAge = Date.now() - new Date(cart.updatedAt).getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    return cartAge > fiveMinutes;
  }
  async refreshCartFromDatabase(): Promise<void> {
    if (!this.authStore.isAuthenticated()) {
      return;
    }

    this._isLoading.set(true);
    try {
      const cart = await firstValueFrom(this.cartService.getCart());
      this._cart.set(cart);
      
      // Update localStorage with fresh data
      this.saveCartToStorage();
      
      if (environment.debug) {
        console.log('Cart refreshed from database - items:', cart.totalItems);
      }
    } catch (error: any) {
      console.error('Failed to refresh cart from database:', error);
      
      this.messageService.add({
        severity: 'error',
        summary: 'Cart Sync Failed',
        detail: 'Failed to sync cart with server'
      });
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Update cart items with additional product information (like quantity limits)
   */
  updateCartItemsWithProductData(updates: Array<{ productId: number; productQuantity: number }>): void {
    const currentCart = this._cart();
    if (!currentCart) {
      return;
    }

    const updatedItems = currentCart.items.map(item => {
      const update = updates.find(u => u.productId === item.productId);
      if (update) {
        return { ...item, productQuantity: update.productQuantity };
      }
      return item;
    });

    const updatedCart = { ...currentCart, items: updatedItems };
    this._cart.set(updatedCart);
    
    // Update localStorage with enhanced data
    this.saveCartToStorage();
  }

  /**
   * Force refresh cart from backend and clear localStorage cache
   * Use this after product deletions to clean up deleted products from cart
   */
  async forceRefreshCart(): Promise<void> {
    if (!this.authStore.isAuthenticated()) {
      this._cart.set(null);
      return;
    }

    // Clear localStorage cache first
    this.clearCartFromStorage();
    
    this._isLoading.set(true);
    try {
      const cart = await firstValueFrom(this.cartService.getCart());
      this._cart.set(cart);
      
      // Save fresh data to localStorage
      this.saveCartToStorage();
      
      if (environment.debug) {
        console.log('Cart force refreshed for user:', cart.userId, 'with', cart.totalItems, 'items');
      }
    } catch (error: any) {
      console.error('Failed to force refresh cart:', error);
      
      // Set empty cart on error
      const emptyCart = {
        userId: this.authStore.user()?.id || 0,
        items: [],
        totalItems: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this._cart.set(emptyCart);
      this.saveCartToStorage();
    } finally {
      this._isLoading.set(false);
    }
  }
}
