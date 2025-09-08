import { Component, OnInit, signal, computed, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SignOutButtonComponent } from '../../ui/sign-out-button/sign-out-button.component';
import { TabManagementComponent } from '../tab-management/tab-management.component';
import { useAuth } from '../../../hooks/auth.hooks';
import { useProducts } from '../../../hooks/product.hooks';
import { useAdminProductSearch, useAdminUserSearch, useAdminCartSearch } from '../../../hooks/admin-search.hooks';
import { useUserManagement } from '../../../hooks/user-management.hooks';
import { useCartManagement } from '../../../hooks/cart-management.hooks';

// NEW: Import the generic dashboard configuration
import { 
  createDashboardConfig, 
  DashboardConfig, 
  DashboardDependencies,
  DashboardOperationsHandler
} from '../object-management-config/dashboard.config';

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

    // Prepare dependencies for configuration
    const dependencies: DashboardDependencies = {
      products: this.products,
      adminProductSearch: this.adminProductSearch,
      userManagement: this.userManagement,
      adminUserSearch: this.adminUserSearch,
      cartManagement: this.cartManagement,
      adminCartSearch: this.adminCartSearch,
      messageService: this.messageService,
      collapseCartRow: collapseCartRow
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

  /**
   * Get admin email for display
   */
  getAdminEmail(): string {
    const user = this.auth.user();
    return user?.email || 'admin@admin.com';
  }
}
