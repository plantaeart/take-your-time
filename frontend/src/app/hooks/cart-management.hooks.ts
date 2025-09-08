import { inject } from '@angular/core';
import { CartManagementStore } from '../stores/cart-management.store';
import { CartItemCreate, CartItemUpdate } from '../models/cart.model';

/**
 * Cart Management Hook
 * Provides clean interface for admin cart management operations
 */
export function useCartManagement() {
  const cartManagementStore = inject(CartManagementStore);

  return {
    // State
    carts: cartManagementStore.carts,
    selectedCartDetails: cartManagementStore.selectedCartDetails,
    isLoading: cartManagementStore.isLoading,
    isUpdating: cartManagementStore.isUpdating,
    isDeleting: cartManagementStore.isDeleting,
    error: cartManagementStore.error,
    lastOperation: cartManagementStore.lastOperation,

    // Computed state
    isAnyOperationInProgress: cartManagementStore.isAnyOperationInProgress,
    totalCarts: cartManagementStore.totalCarts,
    cartsWithItems: cartManagementStore.cartsWithItems,
    emptyCarts: cartManagementStore.emptyCarts,

    // Actions
    loadUserCarts: (params: {
      skip?: number;
      limit?: number;
      search?: string;
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}) => cartManagementStore.loadUserCarts(params),
    
    loadUserCartDetails: (userId: number) => cartManagementStore.loadUserCartDetails(userId),
    
    addItemToUserCart: (userId: number, item: CartItemCreate) => 
      cartManagementStore.addItemToUserCart(userId, item),
    
    updateUserCartItem: (userId: number, productId: number, update: CartItemUpdate) => 
      cartManagementStore.updateUserCartItem(userId, productId, update),
    
    removeItemFromUserCart: (userId: number, productId: number) => 
      cartManagementStore.removeItemFromUserCart(userId, productId),
    
    clearUserCart: (userId: number) => cartManagementStore.clearUserCart(userId),
    
    bulkClearUserCarts: (userIds: number[]) => cartManagementStore.bulkClearUserCarts(userIds),

    // Utilities
    clearSelectedCartDetails: () => cartManagementStore.clearSelectedCartDetails(),
    clearError: () => cartManagementStore.clearError(),
    reset: () => cartManagementStore.reset()
  };
}
