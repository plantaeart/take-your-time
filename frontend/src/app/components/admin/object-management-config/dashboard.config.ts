/**
 * Admin Dashboard Configuration
 * 
 * This file provides a centralized configuration for the admin dashboard,
 * making it generic and config-driven rather than hardcoded in the component.
 * 
 * Features:
 * - Complete CRUD operations configuration
 * - Data loading and refresh management
 * - Notification handling
 * - Tab-specific configurations
 * - Centralized dependency injection
 */

import { DashboardTabConfig } from './table-config.interface';
import { createProductDashboardConfig } from './product.config';
import { createUserDashboardConfig } from './user.config';
import { createCartDashboardConfig } from './user-cart.config';
import { createWishlistDashboardConfig } from './user-wishlist.config';
import { Product } from '../../../models/product.model';
import { User } from '../../../models/user.model';
import { AdminUserCartData } from '../../../models/user-cart.model';
import { AdminUserWishlistData } from '../../../models/user-wishlist.model';

// Dashboard tab configuration type
export interface DashboardConfig {
  tabs: {
    products: DashboardTabConfig<Product>;
    users: DashboardTabConfig<User>;
    carts: DashboardTabConfig<AdminUserCartData>;
    wishlists: DashboardTabConfig<AdminUserWishlistData>;
  };
}

// Dashboard dependencies interface
export interface DashboardDependencies {
  // Product hooks and services
  products: any;
  adminProductSearch: any;
  
  // User hooks and services
  userManagement: any;
  adminUserSearch: any;
  
  // Cart hooks and services
  cartManagement: any;
  adminCartSearch: any;
  
  // Wishlist hooks and services
  wishlistManagement: any;
  adminWishlistSearch: any;
  
  // Shared services
  messageService: any;
  
  // Row control functions
  collapseCartRow?: (itemId: any) => void;
  collapseWishlistRow?: (itemId: any) => void;
}

/**
 * Create complete dashboard configuration with all dependencies injected
 */
export function createDashboardConfig(deps: DashboardDependencies): DashboardConfig {
  return {
    tabs: {
      products: createProductDashboardConfig(
        deps.products,
        deps.adminProductSearch,
        deps.messageService
      ),
      
      users: createUserDashboardConfig(
        deps.userManagement,
        deps.adminUserSearch,
        deps.messageService
      ),
      
      carts: createCartDashboardConfig(
        deps.cartManagement,
        deps.adminCartSearch,
        deps.messageService,
        deps.collapseCartRow
      ),
      
      wishlists: createWishlistDashboardConfig(
        deps.wishlistManagement,
        deps.adminWishlistSearch,
        deps.messageService,
        deps.collapseWishlistRow
      )
    }
  };
}

/**
 * Generic dashboard operations handler
 * 
 * This provides a centralized way to handle all CRUD operations
 * across different tabs using the configuration
 */
export class DashboardOperationsHandler {
  constructor(
    private config: DashboardConfig,
    private messageService: any
  ) {}
  
  /**
   * Handle create operation for any tab
   */
  async handleCreate(tabName: keyof DashboardConfig['tabs'], itemData: any): Promise<boolean> {
    const tabConfig = this.config.tabs[tabName];
    const operation = tabConfig.operations?.create;
    
    if (!operation?.enabled) {
      this.showError(operation?.errorMessage || `Create operation not supported for ${tabName}`);
      return false;
    }
    
    try {
      await operation.handler(itemData);
      
      if (tabConfig.notifications?.showSuccessMessages) {
        this.showSuccess(operation.successMessage || `${tabName} created successfully`);
      }
      
      if (operation.refreshAfterCreate && tabConfig.dataLoader?.refreshTrigger) {
        await tabConfig.dataLoader.refreshTrigger(operation.refreshParams);
      }
      
      return true;
    } catch (error: any) {
      const errorMessage = operation.errorMessage || `Failed to create ${tabName}`;
      this.showError(`${errorMessage}: ${error.message || error}`);
      return false;
    }
  }
  
  /**
   * Handle update operation for any tab
   */
  async handleUpdate(tabName: keyof DashboardConfig['tabs'], id: any, itemData: any): Promise<boolean> {
    const tabConfig = this.config.tabs[tabName];
    const operation = tabConfig.operations?.update;
    
    if (!operation?.enabled) {
      this.showError(operation?.errorMessage || `Update operation not supported for ${tabName}`);
      return false;
    }
    
    try {
      await operation.handler(id, itemData);
      
      if (tabConfig.notifications?.showSuccessMessages) {
        this.showSuccess(operation.successMessage || `${tabName} updated successfully`);
      }
      
      if (operation.refreshAfterUpdate && tabConfig.dataLoader?.refreshTrigger) {
        await tabConfig.dataLoader.refreshTrigger(operation.refreshParams);
      }
      
      return true;
    } catch (error: any) {
      const errorMessage = operation.errorMessage || `Failed to update ${tabName}`;
      this.showError(`${errorMessage}: ${error.message || error}`);
      return false;
    }
  }
  
  /**
   * Handle delete operation for any tab
   */
  async handleDelete(tabName: keyof DashboardConfig['tabs'], id: any): Promise<boolean> {
    const tabConfig = this.config.tabs[tabName];
    const operation = tabConfig.operations?.delete;
    
    if (!operation?.enabled) {
      this.showError(operation?.errorMessage || `Delete operation not supported for ${tabName}`);
      return false;
    }
    
    try {
      await operation.handler(id);
      
      if (tabConfig.notifications?.showSuccessMessages) {
        this.showSuccess(operation.successMessage || `${tabName} deleted successfully`);
      }
      
      if (operation.refreshAfterDelete && tabConfig.dataLoader?.refreshTrigger) {
        await tabConfig.dataLoader.refreshTrigger(operation.refreshParams);
      }
      
      return true;
    } catch (error: any) {
      const errorMessage = operation.errorMessage || `Failed to delete ${tabName}`;
      this.showError(`${errorMessage}: ${error.message || error}`);
      return false;
    }
  }
  
  /**
   * Handle bulk delete operation for any tab
   */
  async handleBulkDelete(tabName: keyof DashboardConfig['tabs'], ids: any[]): Promise<boolean> {
    const tabConfig = this.config.tabs[tabName];
    const operation = tabConfig.operations?.bulkDelete;
    
    if (!operation?.enabled) {
      this.showError(operation?.errorMessage || `Bulk delete operation not supported for ${tabName}`);
      return false;
    }
    
    try {
      await operation.handler(ids);
      
      if (tabConfig.notifications?.showSuccessMessages) {
        this.showSuccess(operation.successMessage || `${tabName} deleted successfully`);
      }
      
      if (operation.refreshAfterDelete && tabConfig.dataLoader?.refreshTrigger) {
        await tabConfig.dataLoader.refreshTrigger(operation.refreshParams);
      }
      
      return true;
    } catch (error: any) {
      const errorMessage = operation.errorMessage || `Failed to delete ${tabName}`;
      this.showError(`${errorMessage}: ${error.message || error}`);
      return false;
    }
  }
  
  /**
   * Handle export operation for any tab
   */
  async handleExport(tabName: keyof DashboardConfig['tabs']): Promise<boolean> {
    const tabConfig = this.config.tabs[tabName];
    const operation = tabConfig.operations?.export;
    
    if (!operation?.enabled) {
      this.showError(operation?.errorMessage || `Export operation not supported for ${tabName}`);
      return false;
    }
    
    try {
      const data = await operation.handler();
      
      // Here you would implement actual export logic (CSV, Excel, etc.)
      // For now, just show success message
      
      if (tabConfig.notifications?.showSuccessMessages) {
        this.showSuccess(operation.successMessage || `${tabName} exported successfully`);
      }
      
      return true;
    } catch (error: any) {
      const errorMessage = operation.errorMessage || `Failed to export ${tabName}`;
      this.showError(`${errorMessage}: ${error.message || error}`);
      return false;
    }
  }
  
  /**
   * Handle data loading for any tab
   */
  async handleDataLoad(tabName: keyof DashboardConfig['tabs'], event: any): Promise<void> {
    const tabConfig = this.config.tabs[tabName];
    const dataLoader = tabConfig.dataLoader;
    
    if (!dataLoader) {
      this.showError(`Data loader not configured for ${tabName}`);
      return;
    }
    
    try {
      const searchParams = dataLoader.searchParamsConverter ? 
        dataLoader.searchParamsConverter(event) : 
        event;
      
      await dataLoader.handler(searchParams);
    } catch (error: any) {
      this.showError(`Failed to load ${tabName} data: ${error.message || error}`);
    }
  }
  
  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: message
    });
  }
  
  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error', 
      detail: message
    });
  }
}
