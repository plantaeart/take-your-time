import { inject } from '@angular/core';
import { WishlistItemCreate } from '../models/wishlist.model';
import { WishlistManagementStore } from 'app/stores/wishlist-management.store';

/**
 * Wishlist Management Hook
 * Provides clean interface for admin wishlist management operations
 */
export function useWishlistManagement() {
  const wishlistManagementStore = inject(WishlistManagementStore);

  return {
    // State
    wishlists: wishlistManagementStore.wishlists,
    selectedWishlistDetails: wishlistManagementStore.selectedWishlistDetails,
    isLoading: wishlistManagementStore.isLoading,
    isUpdating: wishlistManagementStore.isUpdating,
    isDeleting: wishlistManagementStore.isDeleting,
    error: wishlistManagementStore.error,
    lastOperation: wishlistManagementStore.lastOperation,

    // Computed state
    isAnyOperationInProgress: wishlistManagementStore.isAnyOperationInProgress,
    totalWishlists: wishlistManagementStore.totalWishlists,
    wishlistsWithItems: wishlistManagementStore.wishlistsWithItems,
    emptyWishlists: wishlistManagementStore.emptyWishlists,

    // Actions
    loadUserWishlists: (params: {
      page?: number;
      limit?: number;
      search?: string;
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}) => wishlistManagementStore.loadUserWishlists(params),
    
    loadUserWishlistDetails: (userId: number) => wishlistManagementStore.loadUserWishlistDetails(userId),
    
    addItemToUserWishlist: (userId: number, item: WishlistItemCreate) => 
      wishlistManagementStore.addItemToUserWishlist(userId, item),
    
    updateUserWishlistItem: (userId: number, oldProductId: number, newProductId: number) => 
      wishlistManagementStore.updateUserWishlistItem(userId, oldProductId, newProductId),
    
    removeItemFromUserWishlist: (userId: number, productId: number) => 
      wishlistManagementStore.removeItemFromUserWishlist(userId, productId),
    
    clearUserWishlist: (userId: number) => wishlistManagementStore.clearUserWishlist(userId),
    
    bulkClearUserWishlists: (userIds: number[]) => wishlistManagementStore.bulkClearUserWishlists(userIds),

    // Utility actions
    clearError: () => wishlistManagementStore.clearError(),
    clearLastOperation: () => wishlistManagementStore.clearLastOperation()
  };
}
