import { inject, computed, effect } from '@angular/core';
import { ProductStore } from '../stores/product.store';
import { 
  Product, 
  ProductQueryParams,
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductInventoryUpdate,
  BulkProductCreateRequest,
  ProductDeletionResponse,
  BulkProductDeletionResponse
} from '../models/product.model';
import { Category } from '../enums/category.enum';
import { InventoryStatus } from '../enums/inventory-status.enum';

/**
 * Product Hooks - Easy-to-use composable functions for components
 * Provides clean interface to ProductStore functionality
 */

/**
 * Main product hook - provides all product functionality
 * Use this hook in components that need full product management
 */
export function useProducts() {
  const store = inject(ProductStore);

  return {
    // ============================================================================
    // REACTIVE STATE (Read-only)
    // ============================================================================
    
    /** All loaded products */
    products: store.products,
    
    /** Total number of records */
    totalRecords: store.totalRecords,
    
    /** Pagination information */
    paginationInfo: store.paginationInfo,
    
    /** Currently selected product */
    selectedProduct: store.selectedProduct,
    
    /** Available categories */
    categories: store.categories,
    
    /** Current filters */
    filters: store.filters,
    
    /** Pagination info */
    pagination: store.pagination,
    
    /** Loading states */
    isLoading: store.isLoading,
    isLoadingMore: store.isLoadingMore,
    
    /** Error states */
    hasError: store.hasError,
    errorMessage: store.errorMessage,
    
    /** Computed states */
    hasProducts: store.hasProducts,
    totalProducts: store.totalProducts,
    canLoadMore: store.canLoadMore,
    filteredProducts: store.filteredProducts,
    productsByCategory: store.productsByCategory,

    // ============================================================================
    // ACTIONS (Methods)
    // ============================================================================
    
    /** Load products (with optional force refresh) */
    loadProducts: (forceRefresh = false) => store.loadProducts(forceRefresh),
    
    /** Load products with lazy loading for PrimeNG */
    loadProductsLazy: (page: number, limit: number, filters?: ProductQueryParams) => store.loadProductsLazy(page, limit, filters),
    
    /** Load more products for pagination */
    loadMore: () => store.loadMoreProducts(),
    
    /** Load specific product by ID */
    loadProductById: (id: number, forceRefresh = false) => store.loadProductById(id, forceRefresh),
    
    /** Load available categories */
    loadCategories: (forceRefresh = false) => store.loadCategories(forceRefresh),
    
    /** Search products */
    search: (searchTerm: string) => store.searchProducts(searchTerm),
    
    /** Filter by category */
    filterByCategory: (category: Category | undefined) => store.filterByCategory(category),
    
    /** Filter by inventory status */
    filterByInventoryStatus: (status: InventoryStatus | undefined) => store.filterByInventoryStatus(status),
    
    /** Set multiple filters */
    setFilters: (filters: Partial<ProductQueryParams>, autoReload = false) => store.setFilters(filters, autoReload),
    
    /** Clear selected product */
    clearSelection: () => store.clearSelectedProduct(),
    
    /** Reset store */
    reset: () => store.resetStore(),
    
    /** Refresh all data */
    refresh: () => store.refreshAll(),
    
    /** Get maximum price from API for filter initialization */
    getMaxPrice: () => store.getMaxPrice(),

    // ============================================================================
    // ADMIN CRUD OPERATIONS
    // ============================================================================
    
    /** Create a new product (Admin only) */
    createProduct: (productData: ProductCreateRequest) => {
      return store.createProduct(productData);
    },
    
    /** Update an existing product (Admin only) */
    updateProduct: (productId: number, productData: ProductUpdateRequest) => store.updateProduct(productId, productData),
    
    /** Delete a product (Admin only) */
    deleteProduct: (productId: number) => store.deleteProduct(productId),
    
    /** Update product inventory (Admin only) */
    updateProductInventory: (productId: number, inventoryData: ProductInventoryUpdate) => store.updateProductInventory(productId, inventoryData),
    
    /** Bulk create products (Admin only) */
    bulkCreateProducts: (bulkData: BulkProductCreateRequest) => store.bulkCreateProducts(bulkData),
    
    /** Bulk delete products (Admin only) */
    bulkDeleteProducts: (productIds: number[]) => store.bulkDeleteProducts(productIds)
  };
}

/**
 * Product list hook - optimized for product listing components
 * Provides essential functionality for product grids/lists
 */
export function useProductList() {
  const store = inject(ProductStore);

  // Auto-load products and categories on hook initialization
  const autoLoad = async () => {
    await Promise.all([
      store.loadCategories(),
      store.loadProducts()
    ]);
  };

  return {
    // Essential state for product lists
    products: store.filteredProducts,
    categories: store.categories,
    isLoading: store.isLoading,
    isLoadingMore: store.isLoadingMore,
    canLoadMore: store.canLoadMore,
    hasProducts: store.hasProducts,
    totalProducts: store.totalProducts,
    errorMessage: store.errorMessage,
    
    // Essential actions for product lists
    loadMore: () => store.loadMoreProducts(),
    search: (term: string) => store.searchProducts(term),
    filterByCategory: (category: Category | undefined) => store.filterByCategory(category),
    refresh: () => store.refreshAll(),
    getMaxPrice: () => store.getMaxPrice(),
    
    // Auto-initialization
    initialize: autoLoad
  };
}

/**
 * Product detail hook - optimized for single product components
 * Provides functionality for product detail views
 */
export function useProductDetail(productId?: number) {
  const store = inject(ProductStore);

  // Auto-load product if ID provided
  if (productId) {
    store.loadProductById(productId);
  }

  return {
    // State for product details
    product: store.selectedProduct,
    isLoading: computed(() => store.isLoading() || !store.selectedProduct()),
    hasError: store.hasError,
    errorMessage: store.errorMessage,
    
    // Actions for product details
    loadProduct: (id: number, forceRefresh = false) => store.loadProductById(id, forceRefresh),
    clearProduct: () => store.clearSelectedProduct(),
    refresh: () => store.selectedProduct() ? store.loadProductById(store.selectedProduct()!.id!, true) : Promise.resolve()
  };
}

/**
 * Product search hook - optimized for search functionality
 * Provides search-specific functionality with debouncing support
 */
export function useProductSearch() {
  const store = inject(ProductStore);

  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  const debouncedSearch = (term: string, delay = 300) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
      store.searchProducts(term);
    }, delay);
  };

  return {
    // Search state
    products: store.filteredProducts,
    isLoading: store.isLoading,
    hasProducts: store.hasProducts,
    searchTerm: computed(() => store.filters().search || ''),
    
    // Search actions
    search: (term: string) => store.searchProducts(term),
    searchWithDebounce: debouncedSearch,
    clearSearch: () => store.setFilters({ search: '' }, true),
    
    // Utility
    cleanup: () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
      }
    }
  };
}

/**
 * Product filters hook - optimized for filtering components
 * Provides filtering functionality with easy filter management
 */
export function useProductFilters() {
  const store = inject(ProductStore);

  return {
    // Filter state
    categories: store.categories,
    filters: store.filters,
    isLoading: store.isLoading,
    
    // Filter actions
    setCategory: (category: Category | undefined) => store.filterByCategory(category),
    setInventoryStatus: (status: InventoryStatus | undefined) => store.filterByInventoryStatus(status),
    setSearch: (term: string) => store.searchProducts(term),
    setFilters: (filters: Partial<ProductQueryParams>) => store.setFilters(filters, true),
    clearFilters: () => store.setFilters({
      search: '',
      category: undefined,
      inventoryStatus: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      priceMin: undefined,
      priceMax: undefined,
      page: 1
    }, true),
    
    // Computed filter info
    hasActiveFilters: computed(() => {
      const f = store.filters();
      return !!(f.search || f.category || f.inventoryStatus || f.sortBy || f.priceMin || f.priceMax);
    }),
    activeFiltersCount: computed(() => {
      const f = store.filters();
      let count = 0;
      if (f.search) count++;
      if (f.category) count++;
      if (f.inventoryStatus) count++;
      if (f.sortBy) count++;
      if (f.priceMin || f.priceMax) count++;
      return count;
    })
  };
}

/**
 * Product pagination hook - optimized for pagination components
 * Provides pagination-specific functionality
 */
export function useProductPagination() {
  const store = inject(ProductStore);

  return {
    // Pagination state
    pagination: store.pagination,
    canLoadMore: store.canLoadMore,
    isLoadingMore: store.isLoadingMore,
    totalProducts: store.totalProducts,
    
    // Pagination actions
    loadMore: () => store.loadMoreProducts(),
    
    // Computed pagination info
    remainingProducts: computed(() => {
      const total = store.pagination().total;
      const loaded = store.totalProducts();
      return Math.max(0, total - loaded);
    }),
    progressPercentage: computed(() => {
      const total = store.pagination().total;
      const loaded = store.totalProducts();
      if (total === 0) return 0;
      return Math.round((loaded / total) * 100);
    })
  };
}

/**
 * Product categories hook - optimized for category components
 * Provides category-specific functionality
 */
export function useProductCategories() {
  const store = inject(ProductStore);

  // Auto-load categories
  store.loadCategories();

  return {
    // Category state
    categories: store.categories,
    isLoading: computed(() => store.isLoading()),
    
    // Category actions
    loadCategories: () => store.loadCategories(true),
    selectCategory: (category: Category | undefined) => store.filterByCategory(category),
    
    // Category utilities
    getCategoryProductCount: (category: Category) => computed(() => {
      const products = store.products();
      return products.filter(p => p.category === category).length;
    })
  };
}
