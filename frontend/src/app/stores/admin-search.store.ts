import { Injectable, signal, computed } from '@angular/core';
import { AdminSearchService } from '../services/admin-search.service';
import { AdminSearchParams, CartSearchResponse, WishlistSearchResponse } from '../models/adminSearch.model';
import { ProductListResponse, Product } from '../models/product.model';
import { UserListResponse, User } from '../models/user.model';
import { ContactSubmissionsResponse, ContactSubmission } from '../models/contact.model';

/**
 * Entity types supported by admin search
 */
export type AdminEntityType = 'products' | 'users' | 'contacts' | 'carts' | 'wishlists';

/**
 * Generic search state interface
 */
interface SearchState<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  isLoading: boolean;
  error: string | null;
  filters: Record<string, any>;
  sorts: Array<{ field: string; direction: 'asc' | 'desc' }>;
}

/**
 * Unified Admin Search Store
 * Manages search state for all admin-managed entities
 */
@Injectable({
  providedIn: 'root'
})
export class AdminSearchStore {
  // Private signals for each entity type
  private _productsState = signal<SearchState<Product>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
    isLoading: false,
    error: null,
    filters: {},
    sorts: []
  });

  private _usersState = signal<SearchState<User>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
    isLoading: false,
    error: null,
    filters: {},
    sorts: []
  });

  private _contactsState = signal<SearchState<ContactSubmission>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
    isLoading: false,
    error: null,
    filters: {},
    sorts: []
  });

  private _cartsState = signal<SearchState<any>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
    isLoading: false,
    error: null,
    filters: {},
    sorts: []
  });

  private _wishlistsState = signal<SearchState<any>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
    isLoading: false,
    error: null,
    filters: {},
    sorts: []
  });

  // Public readonly signals
  productsState = this._productsState.asReadonly();
  usersState = this._usersState.asReadonly();
  contactsState = this._contactsState.asReadonly();
  cartsState = this._cartsState.asReadonly();
  wishlistsState = this._wishlistsState.asReadonly();

  // Computed signals for convenience
  isAnyLoading = computed(() => 
    this._productsState().isLoading ||
    this._usersState().isLoading ||
    this._contactsState().isLoading ||
    this._cartsState().isLoading ||
    this._wishlistsState().isLoading
  );

  constructor(private adminSearchService: AdminSearchService) {}

  /**
   * Search products with filters and sorting
   */
  async searchProducts(params: Partial<AdminSearchParams>): Promise<void> {
    const currentState = this._productsState();
    const searchParams: AdminSearchParams = {
      page: params.page ?? currentState.page,
      limit: params.limit ?? currentState.limit,
      filters: params.filters ?? currentState.filters,
      sorts: params.sorts ?? currentState.sorts
    };

    this._productsState.update(state => ({
      ...state,
      isLoading: true,
      error: null,
      ...searchParams
    }));

    try {
      const response = await this.adminSearchService.searchProducts(searchParams).toPromise();
      this._productsState.update(state => ({
        ...state,
        items: response!.products,
        total: response!.total,
        page: response!.page,
        limit: response!.limit,
        totalPages: response!.totalPages,
        hasNext: response!.hasNext,
        hasPrev: response!.hasPrev,
        isLoading: false
      }));
    } catch (error: any) {
      this._productsState.update(state => ({
        ...state,
        isLoading: false,
        error: error?.error?.detail || 'Failed to search products'
      }));
    }
  }

  /**
   * Search users with filters and sorting
   */
  async searchUsers(params: Partial<AdminSearchParams>): Promise<void> {
    const currentState = this._usersState();
    const searchParams: AdminSearchParams = {
      page: params.page ?? currentState.page,
      limit: params.limit ?? currentState.limit,
      filters: params.filters ?? currentState.filters,
      sorts: params.sorts ?? currentState.sorts
    };

    this._usersState.update(state => ({
      ...state,
      isLoading: true,
      error: null,
      ...searchParams
    }));

    try {
      const response = await this.adminSearchService.searchUsers(searchParams).toPromise();
      this._usersState.update(state => ({
        ...state,
        items: response!.users,
        total: response!.total,
        page: response!.page,
        limit: response!.limit,
        totalPages: response!.totalPages,
        hasNext: response!.hasNext,
        hasPrev: response!.hasPrev,
        isLoading: false
      }));
    } catch (error: any) {
      this._usersState.update(state => ({
        ...state,
        isLoading: false,
        error: error?.error?.detail || 'Failed to search users'
      }));
    }
  }

  /**
   * Search contacts with filters and sorting
   */
  async searchContacts(params: Partial<AdminSearchParams>): Promise<void> {
    const currentState = this._contactsState();
    const searchParams: AdminSearchParams = {
      page: params.page ?? currentState.page,
      limit: params.limit ?? currentState.limit,
      filters: params.filters ?? currentState.filters,
      sorts: params.sorts ?? currentState.sorts
    };

    this._contactsState.update(state => ({
      ...state,
      isLoading: true,
      error: null,
      ...searchParams
    }));

    try {
      const response = await this.adminSearchService.searchContacts(searchParams).toPromise();
      this._contactsState.update(state => ({
        ...state,
        items: response!.submissions,
        total: response!.total,
        page: Math.floor(response!.skip / response!.limit) + 1, // Convert skip to page
        limit: response!.limit,
        totalPages: Math.ceil(response!.total / response!.limit),
        hasNext: (response!.skip + response!.limit) < response!.total,
        hasPrev: response!.skip > 0,
        isLoading: false
      }));
    } catch (error: any) {
      this._contactsState.update(state => ({
        ...state,
        isLoading: false,
        error: error?.error?.detail || 'Failed to search contacts'
      }));
    }
  }

  /**
   * Search carts with filters and sorting
   */
  async searchCarts(params: Partial<AdminSearchParams>): Promise<void> {
    const currentState = this._cartsState();
    const searchParams: AdminSearchParams = {
      page: params.page ?? currentState.page,
      limit: params.limit ?? currentState.limit,
      filters: params.filters ?? currentState.filters,
      sorts: params.sorts ?? currentState.sorts
    };

    this._cartsState.update(state => ({
      ...state,
      isLoading: true,
      error: null,
      ...searchParams
    }));

    try {
      const response = await this.adminSearchService.searchCarts(searchParams).toPromise();
      this._cartsState.update(state => ({
        ...state,
        items: response!.carts,
        total: response!.total,
        page: response!.page,
        limit: response!.limit,
        totalPages: response!.totalPages,
        hasNext: response!.hasNext,
        hasPrev: response!.hasPrev,
        isLoading: false
      }));
    } catch (error: any) {
      this._cartsState.update(state => ({
        ...state,
        isLoading: false,
        error: error?.error?.detail || 'Failed to search carts'
      }));
    }
  }

  /**
   * Search wishlists with filters and sorting
   */
  async searchWishlists(params: Partial<AdminSearchParams>): Promise<void> {
    const currentState = this._wishlistsState();
    const searchParams: AdminSearchParams = {
      page: params.page ?? currentState.page,
      limit: params.limit ?? currentState.limit,
      filters: params.filters ?? currentState.filters,
      sorts: params.sorts ?? currentState.sorts
    };

    this._wishlistsState.update(state => ({
      ...state,
      isLoading: true,
      error: null,
      ...searchParams
    }));

    try {
      const response = await this.adminSearchService.searchWishlists(searchParams).toPromise();
      this._wishlistsState.update(state => ({
        ...state,
        items: response!.wishlists,
        total: response!.total,
        page: response!.page,
        limit: response!.limit,
        totalPages: response!.totalPages,
        hasNext: response!.hasNext,
        hasPrev: response!.hasPrev,
        isLoading: false
      }));
    } catch (error: any) {
      this._wishlistsState.update(state => ({
        ...state,
        isLoading: false,
        error: error?.error?.detail || 'Failed to search wishlists'
      }));
    }
  }

  /**
   * Clear error for specific entity type
   */
  clearError(entityType: AdminEntityType): void {
    switch (entityType) {
      case 'products':
        this._productsState.update(state => ({ ...state, error: null }));
        break;
      case 'users':
        this._usersState.update(state => ({ ...state, error: null }));
        break;
      case 'contacts':
        this._contactsState.update(state => ({ ...state, error: null }));
        break;
      case 'carts':
        this._cartsState.update(state => ({ ...state, error: null }));
        break;
      case 'wishlists':
        this._wishlistsState.update(state => ({ ...state, error: null }));
        break;
    }
  }

  /**
   * Reset state for specific entity type
   */
  resetState(entityType: AdminEntityType): void {
    const initialState = {
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
      isLoading: false,
      error: null,
      filters: {},
      sorts: []
    };

    switch (entityType) {
      case 'products':
        this._productsState.set(initialState);
        break;
      case 'users':
        this._usersState.set(initialState);
        break;
      case 'contacts':
        this._contactsState.set(initialState);
        break;
      case 'carts':
        this._cartsState.set(initialState);
        break;
      case 'wishlists':
        this._wishlistsState.set(initialState);
        break;
    }
  }
}
