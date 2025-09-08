import { inject } from '@angular/core';
import { AdminCartStore } from '../stores/admin-cart.store';
import { MessageService } from 'primeng/api';
import { CartItemAddRequest } from '../services/admin-cart.service';

/**
 * Hook for admin cart management operations
 * Provides methods to update and delete cart items with loading states and error handling
 */
export function useAdminCart() {
  const store = inject(AdminCartStore);
  const messageService = inject(MessageService);

  /**
   * Add an item to a user's cart
   */
  const addItemToCart = async (userId: number, payload: CartItemAddRequest): Promise<boolean> => {
    const success = await store.addItemToCart(userId, payload);
    
    if (success) {
      messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Product added to cart successfully'
      });
    } else {
      const error = store.error();
      messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error || 'Failed to add product to cart'
      });
    }
    
    return success;
  };

  /**
   * Update quantity of an item in a user's cart
   */
  const updateCartItemQuantity = async (userId: number, productId: number, quantity: number): Promise<boolean> => {
    const success = await store.updateCartItemQuantity(userId, productId, quantity);
    
    if (success) {
      messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Cart item quantity updated successfully'
      });
    } else {
      const error = store.error();
      messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error || 'Failed to update cart item quantity'
      });
    }
    
    return success;
  };

  /**
   * Remove an item from a user's cart
   */
  const removeCartItem = async (userId: number, productId: number): Promise<boolean> => {
    const success = await store.removeCartItem(userId, productId);
    
    if (success) {
      messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Item removed from cart successfully'
      });
    } else {
      const error = store.error();
      messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error || 'Failed to remove item from cart'
      });
    }
    
    return success;
  };

  /**
   * Clear all items from a user's cart
   */
  const clearUserCart = async (userId: number): Promise<boolean> => {
    const success = await store.clearUserCart(userId);
    
    if (success) {
      messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'User cart cleared successfully'
      });
    } else {
      const error = store.error();
      messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error || 'Failed to clear user cart'
      });
    }
    
    return success;
  };

  /**
   * Clear error state
   */
  const clearError = (): void => {
    store.clearError();
  };

  /**
   * Reset store state
   */
  const reset = (): void => {
    store.reset();
  };

  return {
    // State
    isLoading: store.isLoading,
    error: store.error,
    lastUpdatedUserId: store.lastUpdatedUserId,
    lastUpdatedProductId: store.lastUpdatedProductId,
    
    // Actions
    addItemToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearUserCart,
    clearError,
    reset
  };
}
