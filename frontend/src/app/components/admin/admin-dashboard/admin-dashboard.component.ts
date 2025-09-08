import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SignOutButtonComponent } from '../../ui/sign-out-button/sign-out-button.component';
import { TabManagementComponent } from '../tab-management/tab-management.component';
import { useAuth } from '../../../hooks/auth.hooks';
import { useProducts } from '../../../hooks/product.hooks';
import { useAdminProductSearch, useAdminUserSearch, useAdminCartSearch, TabManagementConverter } from '../../../hooks/admin-search.hooks';
import { useUserManagement } from '../../../hooks/user-management.hooks';
import { useCartManagement } from '../../../hooks/cart-management.hooks';
import { PRODUCT_TABLE_CONFIG } from '../object-management-config/product.config';
import { USER_TABLE_CONFIG } from '../object-management-config/user.config';
import { AdminSearchStore } from '../../../stores/admin-search.store';
import { ADMIN_USER_CART_TABLE_CONFIG } from '../object-management-config/admin-user-cart.config';
import { AdminUserCartData } from '../../../models/admin-user-cart.model';
import { Product, ProductCreateRequest, ProductUpdateRequest } from '../../../models/product.model';
import { User } from '../../../models/user.model';
import { AdminSearchParams } from '../../../models/adminSearch.model';

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
  providers: [MessageService],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  // Services
  private messageService = inject(MessageService);
  private adminSearchStore = inject(AdminSearchStore);
  
  // Use auth hook to get admin user info
  auth = useAuth();
  
  // Use product hooks for CRUD operations
  products = useProducts();
  
  // Use admin product search hook
  adminProductSearch = useAdminProductSearch();
  
  // Use admin user search hook for reading/searching users
  adminUserSearch = useAdminUserSearch();
  
  // Use user management hook for CRUD operations
  userManagement = useUserManagement();
  
  // Use cart management hook for cart CRUD operations
  cartManagement = useCartManagement();
  
  // Use admin cart search hook (now returns AdminUserCartData)
  adminCartSearch = useAdminCartSearch();
  
  // Product table configuration with CRUD operations
  productTableConfig = {
    ...PRODUCT_TABLE_CONFIG,
    loadData: async (page: number, limit: number, filters: any) => {
      const searchParams: Partial<AdminSearchParams> = {
        page,
        limit,
        ...filters
      };
      await this.adminProductSearch.search(searchParams);
      const state = this.adminProductSearch.state();
      return {
        data: state.items,
        total: state.total
      };
    },
    createItem: async (item: ProductCreateRequest) => {
      try {
        await this.products.createProduct(item);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Product created successfully'
        });
        // Refresh the data
        await this.onProductDataLoad({ page: 1, size: 10, sorts: [], filters: {} });
      } catch (error: any) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to create product'
        });
        throw error;
      }
    },
    updateItem: async (id: number, item: ProductUpdateRequest) => {
      try {
        await this.products.updateProduct(id, item);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Product updated successfully'
        });
        // Refresh the data
        await this.onProductDataLoad({ page: 1, size: 10, sorts: [], filters: {} });
      } catch (error: any) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to update product'
        });
        throw error;
      }
    },
    deleteItem: async (id: number) => {
      try {
        await this.products.deleteProduct(id);
        // Refresh the product list after deletion
        await this.adminProductSearch.search({});
        return Promise.resolve();
      } catch (error) {
        // Re-throw the error so the tab-management component can handle the toast
        throw error;
      }
    },
    bulkDelete: async (ids: number[]) => {
      try {
        const result = await this.products.bulkDeleteProducts(ids);
        // Refresh the product list after deletion
        await this.adminProductSearch.search({});
        return result;
      } catch (error) {
        // Re-throw the error so the tab-management component can handle the toast
        throw error;
      }
    },
    exportData: async () => {
      // Return all products for export
      return this.adminProductSearch.state().items;
    }
  };
  
  // Product data computed from admin search state
  productData = computed(() => this.adminProductSearch.state().items);
  
  // Loading state computed from admin search state  
  isLoadingProducts = computed(() => this.adminProductSearch.state().isLoading);

  // User data computed from admin search state
  userData = computed(() => this.adminUserSearch.state().items);
  
  // User loading state computed from admin search state  
  isLoadingUsers = computed(() => this.adminUserSearch.state().isLoading);

  // Cart data computed from admin search state (original format for hierarchy)
  cartData = computed(() => {
    const state = this.adminCartSearch.state();
    
    // Filter out admin users (userId 1 is typically the admin)
    const nonAdminCarts = state.items.filter((cart: AdminUserCartData) => cart.userId !== 1);
    
    return nonAdminCarts;
  });

  // Cart loading state computed from admin search state  
  isLoadingCarts = computed(() => this.adminCartSearch.state().isLoading);

  // User table configuration with CRUD operations using hooks
  userTableConfig = {
    ...USER_TABLE_CONFIG,
    updateItem: async (id: number, item: Partial<User>) => {
      try {
        await this.userManagement.updateUser(id, item);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'User updated successfully'
        });
        // Refresh the data
        await this.onUserDataLoad({ page: 1, size: 25, sorts: [], filters: {} });
      } catch (error: any) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to update user'
        });
        throw error;
      }
    },
    deleteItem: async (id: number) => {
      try {
        await this.userManagement.deleteUser(id);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'User deleted successfully'
        });
        // Refresh the data
        await this.onUserDataLoad({ page: 1, size: 25, sorts: [], filters: {} });
      } catch (error: any) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to delete user'
        });
        throw error;
      }
    },
    executeCustomAction: async (action: string, id: number) => {
      try {
        if (action === 'activate') {
          await this.userManagement.activateUser(id);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User activated successfully'
          });
        } else if (action === 'deactivate') {
          await this.userManagement.deactivateUser(id);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User deactivated successfully'
          });
        }
        // Refresh the data
        await this.onUserDataLoad({ page: 1, size: 25, sorts: [], filters: {} });
      } catch (error: any) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || `Failed to ${action} user`
        });
        throw error;
      }
    }
  };

  // Cart table configuration with CRUD operations using new flattened structure
  cartTableConfig = {
    ...ADMIN_USER_CART_TABLE_CONFIG,
    deleteItem: async (itemData: any) => {
      try {
        // Handle different types of deletion based on item level
        if (itemData.hasOwnProperty('productId') && itemData.hasOwnProperty('parentUserId')) {
          // This is a cart item (level 1) - remove from cart
          const userId = itemData.parentUserId;
          const productId = itemData.productId;
          
          await this.cartManagement.removeItemFromUserCart(userId, productId);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Item removed from cart successfully'
          });
        } else if (itemData.hasOwnProperty('userId')) {
          // This is a user (level 0) - clear their entire cart
          const userId = itemData.userId;
          
          await this.cartManagement.clearUserCart(userId);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User cart cleared successfully'
          });
        }
        
        // Refresh the data
        await this.onCartDataLoad({ page: 1, size: 25, sorts: [], filters: {} });
      } catch (error: any) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to delete item'
        });
        throw error;
      }
    },
    executeCustomAction: async (action: string, userId: number) => {
      try {
        if (action === 'clear-cart') {
          await this.cartManagement.clearUserCart(userId);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Cart cleared successfully'
          });
        } else if (action === 'add-product') {
          // The add-product action is now handled directly in the tab-management component
          // No additional action needed here as the UI is handled by the component
        }
        // Refresh the data
        await this.onCartDataLoad({ page: 1, size: 25, sorts: [], filters: {} });
      } catch (error: any) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || `Failed to ${action}`
        });
        throw error;
      }
    }
  };

  ngOnInit(): void {
    // Trigger initial data load for products, users, and carts
    this.onProductDataLoad({ page: 1, size: 25, sorts: [], filters: {} });
    this.onUserDataLoad({ page: 1, size: 25, sorts: [], filters: {} });
    this.onCartDataLoad({ page: 1, size: 25, sorts: [], filters: {} });
  }

  /**
   * Handle data load requests from tab-management component
   */
  async onProductDataLoad(event: { page: number; size: number; sorts: any[]; filters: any }): Promise<void> {
    // Convert tab-management event to AdminSearchParams using the converter
    const searchParams = TabManagementConverter.convertTabManagementEvent(
      event,
      PRODUCT_TABLE_CONFIG.globalFilterFields || ['name', 'description']
    );
    
    try {
      await this.adminProductSearch.search(searchParams);
    } catch (error) {
      // Error loading products
    }
  }

  /**
   * Handle data load requests from user tab-management component
   */
  async onUserDataLoad(event: { page: number; size: number; sorts: any[]; filters: any }): Promise<void> {
    // Convert tab-management event to AdminSearchParams using the converter
    const searchParams = TabManagementConverter.convertTabManagementEvent(
      event,
      USER_TABLE_CONFIG.globalFilterFields || ['username', 'email']
    );
    
    try {
      await this.adminUserSearch.search(searchParams);
    } catch (error) {
      // Error loading users
    }
  }

  /**
   * Handle data load requests from cart tab-management component
   */
  async onCartDataLoad(event: { page: number; size: number; sorts: any[]; filters: any }): Promise<void> {
    try {
      // Convert tab-management event to AdminSearchParams using the converter
      const searchParams = TabManagementConverter.convertTabManagementEvent(
        event,
        ADMIN_USER_CART_TABLE_CONFIG.globalFilterFields || ['userName', 'email', 'firstname']
      );
      
      await this.adminCartSearch.search(searchParams);
    } catch (error) {
      // Error loading cart data
    }
  }

  /**
   * Get admin email for display
   */
  get adminEmail(): string {
    return this.auth.user()?.email || 'Admin';
  }
}
