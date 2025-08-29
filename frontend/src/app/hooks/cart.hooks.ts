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
    loadCart: () => cartStore.loadCart(),
    addToCart: (productId: number, quantity: number = 1) => cartStore.addToCart(productId, quantity),
    updateCartItem: (productId: number, quantity: number) => cartStore.updateCartItem(productId, quantity),
    removeFromCart: (productId: number) => cartStore.removeFromCart(productId),
    clearCart: () => cartStore.clearCart(),

    // Helpers
    getCartItem: (productId: number) => cartStore.getCartItem(productId),
    isProductInCart: (productId: number) => cartStore.isProductInCart(productId),
    getProductQuantityInCart: (productId: number) => cartStore.getProductQuantityInCart(productId),
    resetCart: () => cartStore.resetCart()
  };
}
