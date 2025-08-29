import { inject } from '@angular/core';
import { WishlistStore } from '../stores/wishlist.store';

/**
 * Wishlist management hook
 */
export function useWishlist() {
  const wishlistStore = inject(WishlistStore);

  return {
    // State
    wishlist: wishlistStore.wishlist,
    wishlistItems: wishlistStore.wishlistItems,
    totalItems: wishlistStore.totalItems,
    isEmpty: wishlistStore.isEmpty,
    isLoading: wishlistStore.isLoading,

    // Actions
    initializeWishlist: () => wishlistStore.initializeWishlist(),
    loadWishlist: () => wishlistStore.loadWishlist(),
    refreshWishlistFromDatabase: () => wishlistStore.refreshWishlistFromDatabase(),
    addToWishlist: (productId: number) => wishlistStore.addToWishlist(productId),
    removeFromWishlist: (productId: number) => wishlistStore.removeFromWishlist(productId),
    clearWishlist: () => wishlistStore.clearWishlist(),
    updateWishlistItemsWithProductData: (updates: Array<{ 
      productId: number; 
      productName?: string;
      productPrice?: number;
      productImage?: string;
      productCategory?: string;
      productQuantity?: number;
    }>) => wishlistStore.updateWishlistItemsWithProductData(updates),
    
    // Helpers
    getWishlistItem: (productId: number) => wishlistStore.getWishlistItem(productId),
    isProductInWishlist: (productId: number) => wishlistStore.isProductInWishlist(productId),
    resetWishlist: () => wishlistStore.resetWishlist(),
    
    // Utility to check if wishlist has data (either from localStorage or database)
    hasWishlistData: () => wishlistStore.wishlistItems().length > 0,
    
    // Check if wishlist should be refreshed from database
    shouldRefreshFromDatabase: () => wishlistStore.shouldRefreshFromDatabase()
  };
}
