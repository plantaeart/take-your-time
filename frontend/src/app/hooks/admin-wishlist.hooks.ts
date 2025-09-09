import { inject } from '@angular/core';
import { AdminWishlistStore } from '../stores/admin-wishlist.store';
import { WishlistItemAddRequest, WishlistItemUpdateRequest } from '../services/admin-wishlist.service';

/**
 * Hook for admin wishlist management functionality
 */
export function useAdminWishlist() {
  const adminWishlistStore = inject(AdminWishlistStore);

  return {
    // State access
    isLoading: adminWishlistStore.isLoading,
    error: adminWishlistStore.error,
    lastUpdatedUserId: adminWishlistStore.lastUpdatedUserId,
    lastUpdatedProductId: adminWishlistStore.lastUpdatedProductId,

    // Actions
    addItemToWishlist: (userId: number, payload: WishlistItemAddRequest) => 
      adminWishlistStore.addItemToWishlist(userId, payload),
    updateWishlistItem: (userId: number, originalProductId: number, updateData: WishlistItemUpdateRequest) =>
      adminWishlistStore.updateWishlistItem(userId, originalProductId, updateData),
    removeWishlistItem: (userId: number, productId: number) => 
      adminWishlistStore.removeWishlistItem(userId, productId),
    clearUserWishlist: (userId: number) => 
      adminWishlistStore.clearUserWishlist(userId),

    // Utility actions
    clearError: () => adminWishlistStore.clearError(),
    reset: () => adminWishlistStore.reset()
  };
}
