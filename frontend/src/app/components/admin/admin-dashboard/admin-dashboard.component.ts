import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { SignOutButtonComponent } from '../../ui/sign-out-button/sign-out-button.component';
import { TabManagementComponent } from '../tab-management/tab-management.component';
import { useAuth } from '../../../hooks/auth.hooks';
import { useProducts } from '../../../hooks/product.hooks';
import { PRODUCT_TABLE_CONFIG } from '../object-management-config/product.config';
import { Product, ProductCreateRequest, ProductUpdateRequest } from '../../../models/product.model';

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
  
  // Use product management hook
  products = useProducts();
  
  // Product table configuration with CRUD operations
  productTableConfig = {
    ...PRODUCT_TABLE_CONFIG,
    loadData: async (page: number, limit: number, filters: any) => {
      await this.products.loadProductsLazy(page, limit, filters);
      return {
        data: this.products.products(),
        total: this.products.totalRecords()
      };
    },
    createItem: (item: ProductCreateRequest) => this.products.createProduct(item),
    updateItem: (id: number, item: ProductUpdateRequest) => this.products.updateProduct(id, item),
    deleteItem: (id: number) => this.products.deleteProduct(id),
    bulkDelete: (ids: number[]) => this.products.bulkDeleteProducts(ids),
    exportData: async () => {
      // Return all products for export
      return this.products.products();
    }
  };
  
  // Product data signal
  productData = this.products.products;
  
  // Loading state
  isLoadingProducts = this.products.isLoading;

  ngOnInit(): void {
    // Load products on component initialization
    this.products.loadProducts();
  }

  /**
   * Get admin email for display
   */
  get adminEmail(): string {
    return this.auth.user()?.email || 'Admin';
  }
}
