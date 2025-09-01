import { inject } from '@angular/core';
import { CartStore } from '../stores/cart.store';

/**
 * Cart management hook - simplified version
 */
export function useCart() {
  const cartStore = inject(CartStore);

  return {
    // State
    cart: cartStore.cart,
    cartItems: cartStore.cartItems,
    totalItems: cartStore.totalItems,
    isEmpty: cartStore.isEmpty,
    isLoading: cartStore.isLoading,

    // Actions
    initializeCart: () => cartStore.initializeCart(),
    loadCart: () => cartStore.loadCart(),
    refreshCartFromDatabase: () => cartStore.refreshCartFromDatabase(),
    forceRefreshCart: () => cartStore.forceRefreshCart(),
    addToCart: (productId: number, quantity: number = 1) => cartStore.addToCart(productId, quantity),
    updateCartItem: (productId: number, quantity: number) => cartStore.updateCartItem(productId, quantity),
    removeFromCart: (productId: number) => cartStore.removeFromCart(productId),
    clearCart: () => cartStore.clearCart(),
    updateCartItemsWithProductData: (updates: Array<{ productId: number; productQuantity: number }>) => 
      cartStore.updateCartItemsWithProductData(updates),

    // Helpers
    getCartItem: (productId: number) => cartStore.getCartItem(productId),
    isProductInCart: (productId: number) => cartStore.isProductInCart(productId),
    getProductQuantityInCart: (productId: number) => cartStore.getProductQuantityInCart(productId),
    resetCart: () => cartStore.resetCart(),
    
    // Utility to check if cart has data (either from localStorage or database)
    hasCartData: () => cartStore.cartItems().length > 0,
    
    // Check if cart should be refreshed from database
    shouldRefreshFromDatabase: () => cartStore.shouldRefreshFromDatabase()
  };
}
