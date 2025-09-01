import axios, { AxiosResponse } from 'axios';
import { Injectable } from '@angular/core';
import { 
  Product, 
  ProductListResponse, 
  ProductQueryParams,
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductInventoryUpdate,
  BulkProductCreateRequest
} from '../models/product.model';
import { Category } from '../enums/category.enum';
import { API_CONFIG, getApiBaseUrl } from './axios/api.config';
import { HTTPStatus, ProductHTTPStatus } from '../enums/http-status.enum';

/**
 * Product Service - Handles public product API endpoints (no authentication required)
 * Communicates with FastAPI backend for product data retrieval
 */
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseUrl: string;
  private readonly apiPath: string = API_CONFIG.ENDPOINTS.PRODUCTS;

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  /**
   * Get all products with optional pagination and filtering
   * GET /api/products
   */
  async getProducts(params?: ProductQueryParams): Promise<ProductListResponse> {
    try {
      const queryParams = this.buildQueryParams(params);
      const response: AxiosResponse<ProductListResponse> = await axios.get(
        `${this.baseUrl}${this.apiPath}`,
        { params: queryParams }
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch products');
    }
  }

  /**
   * Get a specific product by ID
   * GET /api/products/{id}
   */
  async getProductById(productId: number): Promise<Product> {
    try {
      const response: AxiosResponse<Product> = await axios.get(
        `${this.baseUrl}${this.apiPath}/${productId}`
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to fetch product with ID ${productId}`);
    }
  }

  /**
   * Get all available product categories
   * GET /api/products/categories
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response: AxiosResponse<string[]> = await axios.get(
        `${this.baseUrl}${this.apiPath}/categories`
      );
      
      // Convert string array to Category enum array
      return response.data as Category[];
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch product categories');
    }
  }

  /**
   * Search products by name or description
   */
  async searchProducts(searchTerm: string, params?: Omit<ProductQueryParams, 'search'>): Promise<ProductListResponse> {
    try {
      const queryParams = this.buildQueryParams({
        ...params,
        search: searchTerm
      });

      const response: AxiosResponse<ProductListResponse> = await axios.get(
        `${this.baseUrl}${this.apiPath}`,
        { params: queryParams }
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to search products with term: ${searchTerm}`);
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: Category, params?: Omit<ProductQueryParams, 'category'>): Promise<ProductListResponse> {
    try {
      const queryParams = this.buildQueryParams({
        ...params,
        category
      });

      const response: AxiosResponse<ProductListResponse> = await axios.get(
        `${this.baseUrl}${this.apiPath}`,
        { params: queryParams }
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to fetch products for category: ${category}`);
    }
  }

  /**
   * Get paginated products
   */
  async getProductsPaginated(page: number = 1, limit: number = 10): Promise<ProductListResponse> {
    try {
      const response: AxiosResponse<ProductListResponse> = await axios.get(
        `${this.baseUrl}${this.apiPath}`,
        { 
          params: { 
            page, 
            limit 
          } 
        }
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to fetch products page ${page}`);
    }
  }

  /**
   * Get maximum price from all products
   * Simple API call to get the highest product price for filter initialization
   */
  async getMaxPrice(): Promise<number> {
    try {
      const response: AxiosResponse<number> = await axios.get(
        `${this.baseUrl}/api/products/max-price`
      );
      
      return response.data || 1000; // Fallback to default
    } catch (error) {
      console.warn('Failed to fetch max price, using default:', error);
      return 1000; // Fallback to default
    }
  }

  // ============================================================================
  // ADMIN CRUD OPERATIONS (Authentication Required)
  // ============================================================================

  /**
   * Create a new product (Admin only)
   * POST /api/products
   */
  async createProduct(productData: ProductCreateRequest): Promise<Product> {
    try {
      const token = this.getAuthToken();
      
      const url = `${this.baseUrl}${this.apiPath}`;
      
      const response: AxiosResponse<Product> = await axios.post(
        url,
        productData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('❌ ProductService createProduct error:', error);
      if (axios.isAxiosError(error)) {
        console.error('📊 Error response status:', error.response?.status);
        console.error('📋 Error response data:', error.response?.data);
        console.error('🔍 Error config:', error.config);
      }
      throw this.handleError(error, 'Failed to create product');
    }
  }

  /**
   * Update an existing product (Admin only)
   * PUT /api/products/{id}
   */
  async updateProduct(productId: number, productData: ProductUpdateRequest): Promise<Product> {
    try {
      const token = this.getAuthToken();
      
      // Filter out read-only/auto-generated fields that shouldn't be updated
      const {
        id,
        code,
        createdAt,
        updatedAt,
        internalReference,
        schemaVersion,
        ...updateData
      } = productData as any;
      
      const url = `${this.baseUrl}${this.apiPath}/${productId}`;
      
      const response: AxiosResponse<Product> = await axios.put(
        url,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('❌ ProductService updateProduct error:', error);
      if (axios.isAxiosError(error)) {
        console.error('📊 Error response status:', error.response?.status);
        console.error('📋 Error response data:', error.response?.data);
        console.error('🔍 Error config:', error.config);
      }
      throw this.handleError(error, `Failed to update product ${productId}`);
    }
  }

  /**
   * Delete a product (Admin only)
   * DELETE /api/products/{id}
   */
  async deleteProduct(productId: number): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ message: string }> = await axios.delete(
        `${this.baseUrl}${this.apiPath}/${productId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to delete product ${productId}`);
    }
  }

  /**
   * Update product inventory (Admin only)
   * PATCH /api/products/{id}/inventory
   */
  async updateProductInventory(productId: number, inventoryData: ProductInventoryUpdate): Promise<Product> {
    try {
      const response: AxiosResponse<Product> = await axios.patch(
        `${this.baseUrl}${this.apiPath}/${productId}/inventory`,
        inventoryData,
        {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update inventory for product ${productId}`);
    }
  }

  /**
   * Bulk create products (Admin only)
   * POST /api/admin/products/bulk
   */
  async bulkCreateProducts(bulkData: BulkProductCreateRequest): Promise<{ 
    created: Product[], 
    errors: Array<{ index: number, error: string }> 
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/admin/products/bulk`,
        bulkData,
        {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to bulk create products');
    }
  }

  /**
   * Bulk delete products (Admin only)
   * DELETE /api/admin/products/bulk
   */
  async bulkDeleteProducts(productIds: number[]): Promise<{ 
    message: string,
    deletedCount: number,
    deletedIds: number[], 
    notFoundIds: number[],
    requestedCount: number
  }> {
    try {
      const response = await axios.request({
        method: 'DELETE',
        url: `${this.baseUrl}/api/admin/products/bulk`,
        data: productIds,
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to bulk delete products');
    }
  }

  /**
   * Get auth token from localStorage
   */
  private getAuthToken(): string {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('❌ No auth_token in localStorage. Available keys:', Object.keys(localStorage));
      throw new Error('Authentication token not found. Please log in.');
    }
    return token;
  }

  /**
   * Build query parameters for API requests
   * Filters out undefined/null values
   */
  private buildQueryParams(params?: ProductQueryParams): Record<string, any> {
    if (!params) return {};

    const queryParams: Record<string, any> = {};

    // Add only defined parameters
    if (params.page !== undefined) queryParams.page = params.page;
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.skip !== undefined) queryParams.skip = params.skip;
    if (params.category !== undefined) queryParams.category = params.category;
    if (params.inventoryStatus !== undefined) queryParams.inventoryStatus = params.inventoryStatus;
    if (params.search !== undefined && params.search.trim()) queryParams.search = params.search.trim();
    if (params.sortBy !== undefined) queryParams.sortBy = params.sortBy;
    if (params.sortOrder !== undefined) queryParams.sortOrder = params.sortOrder;
    if (params.priceMin !== undefined) queryParams.priceMin = params.priceMin;
    if (params.priceMax !== undefined) queryParams.priceMax = params.priceMax;

    return queryParams;
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: any, message: string): Error {
    console.error(`ProductService Error: ${message}`, error);

    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      
      // Handle specific HTTP status codes
      if (status === HTTPStatus.NOT_FOUND) {
        return new Error('Product not found');
      }
      if (status === HTTPStatus.BAD_REQUEST) {
        return new Error(error.response.data?.detail || 'Invalid request parameters');
      }
      if (status >= HTTPStatus.INTERNAL_SERVER_ERROR) {
        return new Error('Server error. Please try again later.');
      }
      
      // General axios error with response
      return new Error(error.response.data?.detail || message);
    }

    // Network or other errors
    if (axios.isAxiosError(error)) {
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        return new Error('Network error. Please check your connection.');
      }
    }

    return new Error(message);
  }
}

// Export singleton instance
export const productService = new ProductService();

// Export class for testing or custom instances
export default ProductService;
