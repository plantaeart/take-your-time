import { Injectable, signal, computed } from '@angular/core';
import { 
  Product, 
  ProductListResponse, 
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
import { ProductService } from '../services/product.service';

/**
 * Product Store - State management for products using Angular 18 signals
 * Implements service-as-store pattern with reactive state management
 */
@Injectable({
  providedIn: 'root'
})
export class ProductStore {

  // ============================================================================
  // REACTIVE VARIABLES (Signals)
  // ============================================================================

  /** All loaded products (for pagination) */
  private readonly _products = signal<Product[]>([]);

  /** Total number of products (for pagination) */
  private readonly _totalRecords = signal<number>(0);

  /** Current pagination info */
  private readonly _paginationInfo = signal<{
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
  }>({
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false
  });

  /** Currently selected product */
  private readonly _selectedProduct = signal<Product | null>(null);

  /** Available product categories */
  private readonly _categories = signal<Category[]>([]);

  /** Current search/filter parameters */
  private readonly _filters = signal<ProductQueryParams>({
    page: 1,
    limit: 10,
    search: '',
    category: undefined,
    inventoryStatus: undefined,
    sortBy: undefined,
    sortOrder: undefined,
    priceMin: undefined,
    priceMax: undefined
  });

  /** Loading states for different operations */
  private readonly _loadingStates = signal({
    products: false,
    selectedProduct: false,
    categories: false,
    loadingMore: false
  });

  /** Error states */
  private readonly _errorStates = signal({
    products: null as string | null,
    selectedProduct: null as string | null,
    categories: null as string | null
  });

  /** Pagination metadata */
  private readonly _pagination = signal({
    currentPage: 1,
    totalPages: 0,
    total: 0,
    hasNext: false,
    hasPrev: false,
    limit: 10
  });

  /** Cache timestamp for smart re-fetching */
  private readonly _lastFetchTime = signal<number>(0);

  // ============================================================================
  // COMPUTED VARIABLES (Derived State)
  // ============================================================================

  /** Read-only access to products */
  readonly products = this._products.asReadonly();

  /** Read-only access to total records */
  readonly totalRecords = this._totalRecords.asReadonly();

  /** Read-only access to pagination info */
  readonly paginationInfo = this._paginationInfo.asReadonly();

  /** Read-only access to selected product */
  readonly selectedProduct = this._selectedProduct.asReadonly();

  /** Read-only access to categories */
  readonly categories = this._categories.asReadonly();

  /** Read-only access to current filters */
  readonly filters = this._filters.asReadonly();

  /** Read-only access to pagination */
  readonly pagination = this._pagination.asReadonly();

  /** Combined loading state - true if any operation is loading */
  readonly isLoading = computed(() => {
    const states = this._loadingStates();
    return states.products || states.selectedProduct || states.categories;
  });

  /** Loading more products (for pagination) */
  readonly isLoadingMore = computed(() => this._loadingStates().loadingMore);

  /** Any error present */
  readonly hasError = computed(() => {
    const errors = this._errorStates();
    return !!(errors.products || errors.selectedProduct || errors.categories);
  });

  /** Current error message */
  readonly errorMessage = computed(() => {
    const errors = this._errorStates();
    return errors.products || errors.selectedProduct || errors.categories;
  });

  /** Whether there are products loaded */
  readonly hasProducts = computed(() => this._products().length > 0);

  /** Total number of products loaded */
  readonly totalProducts = computed(() => this._products().length);

  /** Whether more products can be loaded */
  readonly canLoadMore = computed(() => {
    const pagination = this._pagination();
    const currentlyLoaded = pagination.limit * pagination.currentPage;
    return currentlyLoaded < pagination.total && !this.isLoadingMore();
  });

  /** Filtered products based on current client-side filters */
  readonly filteredProducts = computed(() => {
    const products = this._products();
    const filters = this._filters();
    
    if (!filters.search && !filters.category && !filters.inventoryStatus) {
      return products;
    }

    return products.filter(product => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false;
      }

      // Inventory status filter
      if (filters.inventoryStatus && product.inventoryStatus !== filters.inventoryStatus) {
        return false;
      }

      return true;
    });
  });

  /** Products grouped by category */
  readonly productsByCategory = computed(() => {
    const products = this.filteredProducts();
    const grouped = new Map<Category, Product[]>();
    
    products.forEach(product => {
      if (!grouped.has(product.category)) {
        grouped.set(product.category, []);
      }
      grouped.get(product.category)!.push(product);
    });
    
    return grouped;
  });

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  constructor(private productService: ProductService) {}

  // ============================================================================
  // METHODS (Actions)
  // ============================================================================

  /**
   * Load products with pagination for PrimeNG lazy loading
   */
  async loadProductsLazy(page: number, limit: number, filters?: ProductQueryParams): Promise<void> {
    this._setLoading('products', true);
    this._clearError('products');

    try {
      const queryParams: ProductQueryParams = {
        ...filters,
        page,
        limit
      };

      const response: ProductListResponse = await this.productService.getProducts(queryParams);
      
      this._products.set(response.products);
      this._totalRecords.set(response.total);
      this._paginationInfo.set({
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        hasNext: response.hasNext
      });
      this._updatePagination(response);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load products';
      this._setError('products', errorMessage);
      console.error('ProductStore.loadProductsLazy error:', error);
      throw error;
    } finally {
      this._setLoading('products', false);
    }
  }

  /**
   * Load products with current filters (replaces existing products)
   */
  async loadProducts(forceRefresh = false): Promise<void> {
    const currentTime = Date.now();
    const cacheAge = currentTime - this._lastFetchTime();
    const isCacheValid = cacheAge < 5 * 60 * 1000; // 5 minutes

    // Skip if cache is valid and not forcing refresh
    if (!forceRefresh && isCacheValid && this.hasProducts()) {
      return;
    }

    this._setLoading('products', true);
    this._clearError('products');

    try {
      const filters = { ...this._filters(), page: 1 }; // Reset to page 1
      const response: ProductListResponse = await this.productService.getProducts(filters);
      
      this._products.set(response.products);
      this._updatePagination(response);
      this._lastFetchTime.set(currentTime);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load products';
      this._setError('products', errorMessage);
      console.error('ProductStore.loadProducts error:', error);
    } finally {
      this._setLoading('products', false);
    }
  }

  /**
   * Load more products (for pagination - appends to existing products)
   */
  async loadMoreProducts(): Promise<void> {
    if (!this.canLoadMore()) {
      return;
    }

    this._setLoading('loadingMore', true);
    this._clearError('products');

    try {
      const currentPage = this._pagination().currentPage;
      const filters = { ...this._filters(), page: currentPage + 1 };
      
      const response: ProductListResponse = await this.productService.getProducts(filters);
      
      // Append new products to existing ones
      const currentProducts = this._products();
      const newProducts = [...currentProducts, ...response.products];
      this._products.set(newProducts);
      
      this._updatePagination(response);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load more products';
      this._setError('products', errorMessage);
      console.error('ProductStore.loadMoreProducts error:', error);
    } finally {
      this._setLoading('loadingMore', false);
    }
  }

  /**
   * Load a specific product by ID
   */
  async loadProductById(productId: number, forceRefresh = false): Promise<void> {
    // Check if product is already loaded and cache is valid
    const existingProduct = this._products().find(p => p.id === productId);
    if (!forceRefresh && existingProduct) {
      this._selectedProduct.set(existingProduct);
      return;
    }

    this._setLoading('selectedProduct', true);
    this._clearError('selectedProduct');

    try {
      const product = await this.productService.getProductById(productId);
      this._selectedProduct.set(product);
      
      // Update product in products array if it exists
      const products = this._products();
      const index = products.findIndex(p => p.id === productId);
      if (index >= 0) {
        const updatedProducts = [...products];
        updatedProducts[index] = product;
        this._products.set(updatedProducts);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load product';
      this._setError('selectedProduct', errorMessage);
      this._selectedProduct.set(null);
      console.error('ProductStore.loadProductById error:', error);
    } finally {
      this._setLoading('selectedProduct', false);
    }
  }

  /**
   * Load available product categories
   */
  async loadCategories(forceRefresh = false): Promise<void> {
    if (!forceRefresh && this._categories().length > 0) {
      return;
    }

    this._setLoading('categories', true);
    this._clearError('categories');

    try {
      const categories = await this.productService.getCategories();
      this._categories.set(categories);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load categories';
      this._setError('categories', errorMessage);
      console.error('ProductStore.loadCategories error:', error);
    } finally {
      this._setLoading('categories', false);
    }
  }

  /**
   * Search products by term
   */
  async searchProducts(searchTerm: string): Promise<void> {
    this.setFilters({ search: searchTerm, page: 1 });
    await this.loadProducts(true);
  }

  /**
   * Filter products by category
   */
  async filterByCategory(category: Category | undefined): Promise<void> {
    this.setFilters({ category, page: 1 });
    await this.loadProducts(true);
  }

  /**
   * Filter products by inventory status
   */
  async filterByInventoryStatus(inventoryStatus: InventoryStatus | undefined): Promise<void> {
    this.setFilters({ inventoryStatus, page: 1 });
    await this.loadProducts(true);
  }

  /**
   * Update filters and optionally reload products
   */
  setFilters(newFilters: Partial<ProductQueryParams>, autoReload = false): void {
    const currentFilters = this._filters();
    const updatedFilters = { ...currentFilters, ...newFilters };
    this._filters.set(updatedFilters);

    if (autoReload) {
      this.loadProducts(true);
    }
  }

  /**
   * Clear selected product
   */
  clearSelectedProduct(): void {
    this._selectedProduct.set(null);
  }

  /**
   * Reset store to initial state
   */
  resetStore(): void {
    this._products.set([]);
    this._selectedProduct.set(null);
    this._categories.set([]);
    this._filters.set({
      page: 1,
      limit: 10,
      search: '',
      category: undefined,
      inventoryStatus: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      priceMin: undefined,
      priceMax: undefined
    });
    this._loadingStates.set({
      products: false,
      selectedProduct: false,
      categories: false,
      loadingMore: false
    });
    this._errorStates.set({
      products: null,
      selectedProduct: null,
      categories: null
    });
    this._pagination.set({
      currentPage: 1,
      totalPages: 0,
      total: 0,
      hasNext: false,
      hasPrev: false,
      limit: 10
    });
    this._lastFetchTime.set(0);
  }

  /**
   * Refresh all data
   */
  async refreshAll(): Promise<void> {
    await Promise.all([
      this.loadProducts(true),
      this.loadCategories(true)
    ]);
  }

  /**
   * Get maximum price from all products via API
   * Simple one-time call for filter initialization
   */
  async getMaxPrice(): Promise<number> {
    try {
      return await this.productService.getMaxPrice();
    } catch (error) {
      console.warn('Failed to get max price from store:', error);
      return 1000; // Fallback default
    }
  }

  // ============================================================================
  // ADMIN CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new product (Admin only)
   */
  async createProduct(productData: ProductCreateRequest): Promise<Product> {
    this._setLoading('products', true);
    this._clearError('products');

    try {
      const newProduct = await this.productService.createProduct(productData);
      
      // Add the new product to the current list
      const currentProducts = this._products();
      this._products.set([newProduct, ...currentProducts]);
      
      return newProduct;
    } catch (error) {
      this._setError('products', error instanceof Error ? error.message : 'Failed to create product');
      throw error;
    } finally {
      this._setLoading('products', false);
    }
  }

  /**
   * Update an existing product (Admin only)
   */
  async updateProduct(productId: number, productData: ProductUpdateRequest): Promise<Product> {
    this._setLoading('products', true);
    this._clearError('products');

    try {
      const updatedProduct = await this.productService.updateProduct(productId, productData);
      
      // Update the product in the current list
      const currentProducts = this._products();
      const updatedProducts = currentProducts.map(product => 
        product.id === productId ? updatedProduct : product
      );
      this._products.set(updatedProducts);
      
      // Update selected product if it's the one being updated
      if (this._selectedProduct()?.id === productId) {
        this._selectedProduct.set(updatedProduct);
      }
      
      return updatedProduct;
    } catch (error) {
      this._setError('products', error instanceof Error ? error.message : 'Failed to update product');
      throw error;
    } finally {
      this._setLoading('products', false);
    }
  }

  /**
   * Delete a product (Admin only)
   */
  async deleteProduct(productId: number): Promise<ProductDeletionResponse> {
    this._setLoading('products', true);
    this._clearError('products');

    try {
      const result = await this.productService.deleteProduct(productId);
      
      // Remove the product from the current list
      const currentProducts = this._products();
      const filteredProducts = currentProducts.filter(product => product.id !== productId);
      this._products.set(filteredProducts);
      
      // Clear selected product if it's the one being deleted
      if (this._selectedProduct()?.id === productId) {
        this._selectedProduct.set(null);
      }
      
      return result;
    } catch (error) {
      this._setError('products', error instanceof Error ? error.message : 'Failed to delete product');
      throw error;
    } finally {
      this._setLoading('products', false);
    }
  }

  /**
   * Update product inventory (Admin only)
   */
  async updateProductInventory(productId: number, inventoryData: ProductInventoryUpdate): Promise<Product> {
    this._setLoading('products', true);
    this._clearError('products');

    try {
      const updatedProduct = await this.productService.updateProductInventory(productId, inventoryData);
      
      // Update the product in the current list
      const currentProducts = this._products();
      const updatedProducts = currentProducts.map(product => 
        product.id === productId ? updatedProduct : product
      );
      this._products.set(updatedProducts);
      
      // Update selected product if it's the one being updated
      if (this._selectedProduct()?.id === productId) {
        this._selectedProduct.set(updatedProduct);
      }
      
      return updatedProduct;
    } catch (error) {
      this._setError('products', error instanceof Error ? error.message : 'Failed to update product inventory');
      throw error;
    } finally {
      this._setLoading('products', false);
    }
  }

  /**
   * Bulk create products (Admin only)
   */
  async bulkCreateProducts(bulkData: BulkProductCreateRequest): Promise<{ 
    created: Product[], 
    errors: Array<{ index: number, error: string }> 
  }> {
    this._setLoading('products', true);
    this._clearError('products');

    try {
      const result = await this.productService.bulkCreateProducts(bulkData);
      
      // Add the new products to the current list
      if (result.created.length > 0) {
        const currentProducts = this._products();
        this._products.set([...result.created, ...currentProducts]);
      }
      
      return result;
    } catch (error) {
      this._setError('products', error instanceof Error ? error.message : 'Failed to bulk create products');
      throw error;
    } finally {
      this._setLoading('products', false);
    }
  }

  /**
   * Bulk delete products (Admin only)
   */
  async bulkDeleteProducts(productIds: number[]): Promise<BulkProductDeletionResponse> {
    this._setLoading('products', true);
    this._clearError('products');

    try {
      const result = await this.productService.bulkDeleteProducts(productIds);
      
      // Remove the deleted products from the current list
      if (result && result.deletedIds && Array.isArray(result.deletedIds) && result.deletedIds.length > 0) {
        const currentProducts = this._products();
        const filteredProducts = currentProducts.filter(product => 
          !result.deletedIds.includes(product.id!)
        );
        this._products.set(filteredProducts);
        
        // Clear selected product if it was deleted
        const selectedId = this._selectedProduct()?.id;
        if (selectedId && result.deletedIds.includes(selectedId)) {
          this._selectedProduct.set(null);
        }
      }
      
      return result;
    } catch (error) {
      this._setError('products', error instanceof Error ? error.message : 'Failed to bulk delete products');
      throw error;
    } finally {
      this._setLoading('products', false);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private _setLoading(operation: keyof ReturnType<typeof this._loadingStates>, loading: boolean): void {
    const current = this._loadingStates();
    this._loadingStates.set({ ...current, [operation]: loading });
  }

  private _setError(operation: keyof ReturnType<typeof this._errorStates>, error: string | null): void {
    const current = this._errorStates();
    this._errorStates.set({ ...current, [operation]: error });
  }

  private _clearError(operation: keyof ReturnType<typeof this._errorStates>): void {
    this._setError(operation, null);
  }

  private _updatePagination(response: ProductListResponse): void {
    this._pagination.set({
      currentPage: response.page,
      totalPages: response.totalPages,
      total: response.total,
      hasNext: response.hasNext,
      hasPrev: response.hasPrev,
      limit: response.limit
    });
  }
}
