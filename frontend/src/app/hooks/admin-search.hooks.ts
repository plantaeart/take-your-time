import { inject } from '@angular/core';
import { AdminSearchStore, AdminEntityType } from '../stores/admin-search.store';
import { AdminSearchParams } from '../models/adminSearch.model';

/**
 * Utility functions for converting tab-management data to AdminSearchParams
 */
export class TabManagementConverter {
  /**
   * Helper method to build filters from tab management filter state
   */
  static buildFiltersFromTabManagement(columnFilters: Record<string, any>, globalFilterValue: string, globalFilterFields: string[]): Record<string, any> {
    const filters: Record<string, any> = {};

    // Add column-specific filters
    Object.entries(columnFilters).forEach(([field, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Handle different filter types
        if (Array.isArray(value) && value.length === 2) {
          // Range filter (e.g., price range, date range)
          filters[field] = value;
        } else if (typeof value === 'string' && value.trim() !== '') {
          // Text filter
          filters[field] = value.trim();
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          // Number or boolean filter
          filters[field] = value;
        }
      }
    });

    // Add global search filter
    if (globalFilterValue && globalFilterValue.trim() !== '') {
      // For global search, we'll use a special filter structure
      // that the backend can interpret across multiple fields
      filters._globalSearch = {
        value: globalFilterValue.trim(),
        fields: globalFilterFields
      };
    }

    return filters;
  }

  /**
   * Helper method to build sorts from tab management sort state
   */
  static buildSortsFromTabManagement(sortField: string, sortOrder: 'asc' | 'desc'): Array<{ field: string; direction: 'asc' | 'desc' }> {
    if (!sortField || !sortOrder) {
      return [];
    }

    return [{ field: sortField, direction: sortOrder }];
  }

  /**
   * Convert tab-management dataLoad event to AdminSearchParams
   */
  static convertTabManagementEvent(
    event: { page: number; size: number; sorts: any[]; filters: any },
    globalFilterFields: string[] = []
  ): AdminSearchParams {
    const { page, size, filters, sorts } = event;
    
    // Build filters using the helper
    const processedFilters = this.buildFiltersFromTabManagement(
      filters || {},
      filters?.search || '',
      globalFilterFields
    );
    
    // Build sorts array
    const processedSorts = sorts?.map(sort => ({
      field: sort.field,
      direction: sort.direction as 'asc' | 'desc'
    })) || [];
    
    return {
      page,
      limit: size,
      filters: processedFilters,
      sorts: processedSorts
    };
  }
}

/**
 * Hook for unified admin search functionality
 */
export function useAdminSearch() {
  const adminSearchStore = inject(AdminSearchStore);

  return {
    // State access
    productsState: adminSearchStore.productsState,
    usersState: adminSearchStore.usersState,
    contactsState: adminSearchStore.contactsState,
    cartsState: adminSearchStore.cartsState,
    wishlistsState: adminSearchStore.wishlistsState,
    isAnyLoading: adminSearchStore.isAnyLoading,

    // Search actions
    searchProducts: (params: Partial<AdminSearchParams>) => adminSearchStore.searchProducts(params),
    searchUsers: (params: Partial<AdminSearchParams>) => adminSearchStore.searchUsers(params),
    searchContacts: (params: Partial<AdminSearchParams>) => adminSearchStore.searchContacts(params),
    searchCarts: (params: Partial<AdminSearchParams>) => adminSearchStore.searchCarts(params),
    searchWishlists: (params: Partial<AdminSearchParams>) => adminSearchStore.searchWishlists(params),

    // Utility actions
    clearError: (entityType: AdminEntityType) => adminSearchStore.clearError(entityType),
    resetState: (entityType: AdminEntityType) => adminSearchStore.resetState(entityType)
  };
}

/**
 * Hook specifically for product admin search
 */
export function useAdminProductSearch() {
  const adminSearchStore = inject(AdminSearchStore);

  return {
    // Product-specific state
    state: adminSearchStore.productsState,
    
    // Product-specific actions
    search: (params: Partial<AdminSearchParams>) => adminSearchStore.searchProducts(params),
    clearError: () => adminSearchStore.clearError('products'),
    reset: () => adminSearchStore.resetState('products')
  };
}

/**
 * Hook specifically for user admin search
 */
export function useAdminUserSearch() {
  const adminSearchStore = inject(AdminSearchStore);

  return {
    // User-specific state
    state: adminSearchStore.usersState,
    
    // User-specific actions
    search: (params: Partial<AdminSearchParams>) => adminSearchStore.searchUsers(params),
    clearError: () => adminSearchStore.clearError('users'),
    reset: () => adminSearchStore.resetState('users')
  };
}

/**
 * Hook specifically for contact admin search
 */
export function useAdminContactSearch() {
  const adminSearchStore = inject(AdminSearchStore);

  return {
    // Contact-specific state
    state: adminSearchStore.contactsState,
    
    // Contact-specific actions
    search: (params: Partial<AdminSearchParams>) => adminSearchStore.searchContacts(params),
    clearError: () => adminSearchStore.clearError('contacts'),
    reset: () => adminSearchStore.resetState('contacts')
  };
}

/**
 * Hook specifically for cart admin search
 */
export function useAdminCartSearch() {
  const adminSearchStore = inject(AdminSearchStore);

  return {
    // Cart-specific state
    state: adminSearchStore.cartsState,
    
    // Cart-specific actions
    search: (params: Partial<AdminSearchParams>) => adminSearchStore.searchCarts(params),
    clearError: () => adminSearchStore.clearError('carts'),
    reset: () => adminSearchStore.resetState('carts')
  };
}

/**
 * Hook specifically for wishlist admin search
 */
export function useAdminWishlistSearch() {
  const adminSearchStore = inject(AdminSearchStore);

  return {
    // Wishlist-specific state
    state: adminSearchStore.wishlistsState,
    
    // Wishlist-specific actions
    search: (params: Partial<AdminSearchParams>) => adminSearchStore.searchWishlists(params),
    clearError: () => adminSearchStore.clearError('wishlists'),
    reset: () => adminSearchStore.resetState('wishlists')
  };
}
