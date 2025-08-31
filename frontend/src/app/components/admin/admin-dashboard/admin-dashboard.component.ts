import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { SignOutButtonComponent } from '../../ui/sign-out-button/sign-out-button.component';
import { TabManagementComponent } from '../tab-management/tab-management.component';
import { useAuth } from '../../../hooks/auth.hooks';
import { useAdminProductSearch, TabManagementConverter } from '../../../hooks/admin-search.hooks';
import { PRODUCT_TABLE_CONFIG } from '../object-management-config/product.config';
import { Product, ProductCreateRequest, ProductUpdateRequest } from '../../../models/product.model';
import { AdminSearchParams } from '../../../models/adminSearch.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TabViewModule,
    SignOutButtonComponent,
    TabManagementComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  // Use auth hook to get admin user info
  auth = useAuth();
  
  // Use admin product search hook
  adminProductSearch = useAdminProductSearch();
  
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
    createItem: (item: ProductCreateRequest) => {
      // TODO: Implement create functionality
      console.log('Create product:', item);
      return Promise.resolve();
    },
    updateItem: (id: number, item: ProductUpdateRequest) => {
      // TODO: Implement update functionality
      console.log('Update product:', id, item);
      return Promise.resolve();
    },
    deleteItem: (id: number) => {
      // TODO: Implement delete functionality
      console.log('Delete product:', id);
      return Promise.resolve();
    },
    bulkDelete: (ids: number[]) => {
      // TODO: Implement bulk delete functionality
      console.log('Bulk delete products:', ids);
      return Promise.resolve();
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

  ngOnInit(): void {

  }

  /**
   * Handle data load requests from tab-management component
   */
  async onProductDataLoad(event: { page: number; size: number; sorts: any[]; filters: any }): Promise<void> {
    console.log('Data load event received:', event);
    
    // Convert tab-management event to AdminSearchParams using the converter
    const searchParams = TabManagementConverter.convertTabManagementEvent(
      event,
      PRODUCT_TABLE_CONFIG.globalFilterFields || ['name', 'description']
    );
    
    try {
      await this.adminProductSearch.search(searchParams);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }

  /**
   * Get admin email for display
   */
  get adminEmail(): string {
    return this.auth.user()?.email || 'Admin';
  }
}
