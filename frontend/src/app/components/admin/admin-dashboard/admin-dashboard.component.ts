import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SignOutButtonComponent } from '../../ui/sign-out-button/sign-out-button.component';
import { TabManagementComponent } from '../tab-management/tab-management.component';
import { useAuth } from '../../../hooks/auth.hooks';
import { useProducts } from '../../../hooks/product.hooks';
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
  
  // Use auth hook to get admin user info
  auth = useAuth();
  
  // Use product hooks for CRUD operations
  products = useProducts();
  
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
        console.error('❌ AdminDashboard createItem error:', error);
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

  ngOnInit(): void {

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
