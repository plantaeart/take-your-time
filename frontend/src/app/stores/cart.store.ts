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
  ) {}

  /**
   * Load cart data from backend - only call this manually when needed
   */
  async loadCart(): Promise<void> {
    if (!this.authStore.isAuthenticated()) {
      this._cart.set(null);
      return;
    }

    this._isLoading.set(true);
    try {
      const cart = await firstValueFrom(this.cartService.getCart());
      this._cart.set(cart);
      
      if (environment.debug) {
        console.log('Cart loaded for user:', cart.userId, 'with', cart.totalItems, 'items');
      }
    } catch (error: any) {
      console.error('Failed to load cart:', error);
      
      // Set empty cart on error
      const emptyCart = {
        userId: this.authStore.user()?.id || 0,
        items: [],
        totalItems: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this._cart.set(emptyCart);
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

    this._isLoading.set(true);
    try {
      const updateData: CartItemUpdate = { quantity };
      await firstValueFrom(this.cartService.updateCartItem(productId, updateData));
      
      // Reload cart to get updated data
      await this.loadCart();
      
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
      this.messageService.add({
        severity: 'error',
        summary: 'Update Failed',
        detail: error.error?.detail || 'Failed to update cart item'
      });
      
      if (environment.debug) {
        console.error('Failed to update cart item:', error);
      }
      
      return false;
    } finally {
      this._isLoading.set(false);
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
    
    if (environment.debug) {
      console.log('Cart state reset');
    }
  }
}
