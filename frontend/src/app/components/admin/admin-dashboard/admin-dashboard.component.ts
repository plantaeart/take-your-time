import { Component, OnInit, signal, computed, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SignOutButtonComponent } from '../../ui/sign-out-button/sign-out-button.component';
import { TabManagementComponent } from '../tab-management/tab-management.component';
import { useAuth } from '../../../hooks/auth.hooks';
import { useProducts } from '../../../hooks/product.hooks';
import { useAdminProductSearch, useAdminUserSearch, useAdminCartSearch, useAdminWishlistSearch } from '../../../hooks/admin-search.hooks';
import { useUserManagement } from '../../../hooks/user-management.hooks';
import { useCartManagement } from '../../../hooks/cart-management.hooks';
import { useAdminContact } from '../../../hooks/admin-contact.hooks';


// NEW: Import the generic dashboard configuration
import { 
  createDashboardConfig, 
  DashboardConfig, 
  DashboardDependencies,
  DashboardOperationsHandler
} from '../object-management-config/dashboard.config';
import { useWishlistManagement } from 'app/hooks/wishlist-management.hooks';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TabViewModule,
    ToastModule,
    SignOutButtonComponent,
    TabManagementComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  // ViewChild for cart tab management component
  @ViewChild('cartTabManagement') cartTabManagement!: TabManagementComponent;
  // ViewChild for wishlist tab management component
  @ViewChild('wishlistTabManagement') wishlistTabManagement!: TabManagementComponent;
  
  // Tab state persistence
  private readonly ACTIVE_TAB_KEY = 'admin-dashboard-active-tab';
  activeTabIndex = signal<number>(0);
  
  // Services
  private messageService = inject(MessageService);
  
  // Use hooks for dependency injection
  auth = useAuth();
  products = useProducts();
  adminProductSearch = useAdminProductSearch();
  adminUserSearch = useAdminUserSearch();
  userManagement = useUserManagement();
  cartManagement = useCartManagement();
  adminCartSearch = useAdminCartSearch();
  wishlistManagement = useWishlistManagement();
  adminWishlistSearch = useAdminWishlistSearch();
  adminContact = useAdminContact();
  
  // NEW: Create generic dashboard configuration
  dashboardConfig!: DashboardConfig;
  operationsHandler!: DashboardOperationsHandler;
  
  constructor() {
    // Configuration will be created in ngOnInit after ViewChild is available
  }
  
  async ngOnInit(): Promise<void> {
    // Create collapse function for cart rows
    const collapseCartRow = (itemId: any) => {
      if (this.cartTabManagement) {
        const expandedItems = this.cartTabManagement.expandedItems();
        expandedItems.delete(itemId);
        this.cartTabManagement.expandedItems.set(new Set(expandedItems));
      }
    };

    // Create collapse function for wishlist rows
    const collapseWishlistRow = (itemId: any) => {
      if (this.wishlistTabManagement) {
        const expandedItems = this.wishlistTabManagement.expandedItems();
        expandedItems.delete(itemId);
        this.wishlistTabManagement.expandedItems.set(new Set(expandedItems));
      }
    };

    // Prepare dependencies for configuration
    const dependencies: DashboardDependencies = {
      products: this.products,
      adminProductSearch: this.adminProductSearch,
      userManagement: this.userManagement,
      adminUserSearch: this.adminUserSearch,
      cartManagement: this.cartManagement,
      adminCartSearch: this.adminCartSearch,
      wishlistManagement: this.wishlistManagement,
      adminWishlistSearch: this.adminWishlistSearch,
      adminContact: this.adminContact,
      messageService: this.messageService,
      collapseCartRow: collapseCartRow,
      collapseWishlistRow: collapseWishlistRow
    };
    
    // Create complete dashboard configuration
    this.dashboardConfig = createDashboardConfig(dependencies);
    
    // Create operations handler for generic CRUD operations
    this.operationsHandler = new DashboardOperationsHandler(
      this.dashboardConfig,
      this.messageService
    );

    // Initialize all tabs with their initial data loads
    await this.loadInitialData();
    
    // Restore active tab from localStorage
    this.restoreActiveTabState();
  }
  
  /**
   * Load initial data for all tabs using configuration
   */
  private async loadInitialData(): Promise<void> {
    try {
      // Load products
      await this.operationsHandler.handleDataLoad('products', 
        this.dashboardConfig.tabs.products.dataLoader?.initialParams
      );
      
      // Load users
      await this.operationsHandler.handleDataLoad('users',
        this.dashboardConfig.tabs.users.dataLoader?.initialParams
      );
      
      // Load carts
      await this.operationsHandler.handleDataLoad('carts',
        this.dashboardConfig.tabs.carts.dataLoader?.initialParams
      );
      
      // Load wishlists
      await this.operationsHandler.handleDataLoad('wishlists',
        this.dashboardConfig.tabs.wishlists.dataLoader?.initialParams
      );
      
      // Load contacts
      await this.operationsHandler.handleDataLoad('contacts',
        this.dashboardConfig.tabs.contacts.dataLoader?.initialParams
      );
    } catch (error) {
      console.error('Error loading initial dashboard data:', error);
    }
  }

  // Computed properties for data binding - now using configuration signals
  productData = computed(() => this.dashboardConfig?.tabs.products.dataSignal?.() || []);
  isLoadingProducts = computed(() => this.dashboardConfig?.tabs.products.loadingSignal?.() || false);
  
  userData = computed(() => this.dashboardConfig?.tabs.users.dataSignal?.() || []);
  isLoadingUsers = computed(() => this.dashboardConfig?.tabs.users.loadingSignal?.() || false);
  
  cartData = computed(() => this.dashboardConfig?.tabs.carts.dataSignal?.() || []);
  isLoadingCarts = computed(() => this.dashboardConfig?.tabs.carts.loadingSignal?.() || false);
  
  wishlistData = computed(() => this.dashboardConfig?.tabs.wishlists.dataSignal?.() || []);
  isLoadingWishlists = computed(() => this.dashboardConfig?.tabs.wishlists.loadingSignal?.() || false);
  
  contactData = computed(() => this.dashboardConfig?.tabs.contacts.dataSignal?.() || []);
  isLoadingContacts = computed(() => this.dashboardConfig?.tabs.contacts.loadingSignal?.() || false);

  // NEW: Generic data loading handlers for each tab
  async onProductDataLoad(event: { page: number; size: number; sorts: any[]; filters: any }): Promise<void> {
    await this.operationsHandler.handleDataLoad('products', event);
  }
  
  async onUserDataLoad(event: { page: number; size: number; sorts: any[]; filters: any }): Promise<void> {
    await this.operationsHandler.handleDataLoad('users', event);
  }
  
  async onCartDataLoad(event: { page: number; size: number; sorts: any[]; filters: any }): Promise<void> {
    await this.operationsHandler.handleDataLoad('carts', event);
  }
  
  async onWishlistDataLoad(event: { page: number; size: number; sorts: any[]; filters: any }): Promise<void> {
    await this.operationsHandler.handleDataLoad('wishlists', event);
  }
  
  async onContactDataLoad(event: { page: number; size: number; sorts: any[]; filters: any }): Promise<void> {
    await this.operationsHandler.handleDataLoad('contacts', event);
  }

  /**
   * Get admin email for display
   */
  getAdminEmail(): string {
    const user = this.auth.user();
    return user?.email || 'admin@admin.com';
  }

  /**
   * Handle tab change and save state to localStorage
   */
  onTabChange(event: any): void {
    const activeIndex = event.index;
    this.activeTabIndex.set(activeIndex);
    this.saveActiveTabState(activeIndex);
  }

  /**
   * Save active tab state to localStorage
   */
  private saveActiveTabState(tabIndex: number): void {
    try {
      localStorage.setItem(this.ACTIVE_TAB_KEY, tabIndex.toString());
    } catch (error) {
      console.warn('Failed to save tab state to localStorage:', error);
    }
  }

  /**
   * Restore active tab state from localStorage
   */
  private restoreActiveTabState(): void {
    try {
      const savedTabIndex = localStorage.getItem(this.ACTIVE_TAB_KEY);
      if (savedTabIndex !== null) {
        const tabIndex = parseInt(savedTabIndex, 10);
        // Validate tab index (5 tabs: Products, Users, Carts, Wishlists, Contact Mails)
        if (tabIndex >= 0 && tabIndex <= 4) {
          this.activeTabIndex.set(tabIndex);
        }
      }
    } catch (error) {
      console.warn('Failed to restore tab state from localStorage:', error);
    }
  }
}
