/**
 * Product Table Management Configuration
 * Following Angular 18 best practic  {
    field: 'price',
    header: 'Price',
    type: 'number',
    sortable: true,
    filterable: true,
    filterType: 'range', // Use range slider for price filtering
    filterMin: 0,
    filterMax: 100, // Will be overridden by actual max price in data
    filterStep: 10,
    width: '6rem',
    editable: true,
    required: true,
    displayFormat: 'currency',
    validations: [
      { rule: 'required', message: 'Price is required' },
      { rule: 'min', value: 0, message: 'Price must be greater than or equal to 0' }
/**
 * Product Table Management Configuration
 * Following Angular 18 best practices with comprehensive typing
 */

import { 
  TableManagementConfig, 
  ColumnConfig, 
  ActionConfig, 
  SearchConfig, 
  ExportConfig, 
  PaginationConfig,
  DashboardTabConfig,
  CrudOperationsConfig,
  DataLoaderConfig,
  NotificationConfig
} from './table-config.interface';
import { Product, ProductCreateRequest, ProductUpdateRequest } from '../../../models/product.model';
import { Category } from '../../../enums/category.enum';
import { InventoryStatus } from '../../../enums/inventory-status.enum';
import { AdminSearchParams } from '../../../models/adminSearch.model';

// Column definitions for Product table
const productColumns: ColumnConfig[] = [
  {
    field: 'id',
    header: 'ID',
    type: 'number',
    sortable: true,
    filterable: true,
    filterType: 'number',
    width: '8rem',
    editable: false
  },
  {
    field: 'name',
    header: 'Name',
    type: 'text',
    sortable: true,
    filterable: true,
    filterType: 'text',
    width: '16rem',
    editable: true,
    required: true,
    validations: [
      { rule: 'required', message: 'Product name is required' },
      { rule: 'minLength', value: 2, message: 'Name must be at least 2 characters' },
      { rule: 'maxLength', value: 100, message: 'Name cannot exceed 100 characters' }
    ],
    editComponent: 'text-input'
  },
  {
    field: 'description',
    header: 'Description',
    type: 'text',
    sortable: false,
    filterable: true,
    filterType: 'text',
    width: '24rem',
    editable: true,
    validations: [
      { rule: 'maxLength', value: 500, message: 'Description cannot exceed 500 characters' }
    ],
    editComponent: 'textarea-input'
  },
  {
    field: 'image',
    header: 'Image',
    type: 'image',
    sortable: false,
    filterable: false,
    width: '10rem',
    editable: true,
    editComponent: 'upload-input'
  },
  {
    field: 'category',
    header: 'Category',
    type: 'enum',
    sortable: true,
    filterable: true,
    filterType: 'dropdown',
    width: '10rem',
    editable: true,
    required: true,
    options: [
      { label: 'Electronics', value: Category.ELECTRONICS, color: 'info' },
      { label: 'Clothing', value: Category.CLOTHING, color: 'success' },
      { label: 'Fitness', value: Category.FITNESS, color: 'warning' },
      { label: 'Accessories', value: Category.ACCESSORIES, color: 'secondary' }
    ],
    validations: [
      { rule: 'required', message: 'Category is required' }
    ],
    editComponent: 'dropdown-input'
  },
  {
    field: 'price',
    header: 'Price',
    type: 'number',
    sortable: true,
    filterable: true,
    filterType: 'range',
    filterStep: 10,
    width: '10rem',
    editable: true,
    required: true,
    displayFormat: 'currency',
    validations: [
      { rule: 'required', message: 'Price is required' },
      { rule: 'min', value: 0, message: 'Price must be greater than or equal to 0' }
    ],
    editComponent: 'currency-input'
  },
  {
    field: 'quantity',
    header: 'Quantity',
    type: 'number',
    sortable: true,
    filterable: true,
    filterType: 'range',
    filterStep: 1,
    width: '10rem',
    editable: true,
    required: true,
    validations: [
      { rule: 'required', message: 'Quantity is required' },
      { rule: 'min', value: 0, message: 'Quantity must be greater than or equal to 0' }
    ],
    editComponent: 'number-input'
  },
  {
    field: 'shellId',
    header: 'Shell ID',
    type: 'number',
    sortable: true,
    filterable: true,
    filterType: 'number',
    width: '10rem',
    editable: true,
    required: true,
    validations: [
      { rule: 'required', message: 'Shell ID is required' },
      { rule: 'min', value: 1, message: 'Shell ID must be greater than 0' }
    ],
    editComponent: 'number-input'
  },
  {
    field: 'inventoryStatus',
    header: 'Status',
    type: 'enum',
    sortable: true,
    filterable: true,
    filterType: 'dropdown',
    width: '10rem',
    editable: true,
    required: true,
    options: [
      { label: 'In Stock', value: InventoryStatus.INSTOCK, color: 'success' },
      { label: 'Low Stock', value: InventoryStatus.LOWSTOCK, color: 'warning' },
      { label: 'Out of Stock', value: InventoryStatus.OUTOFSTOCK, color: 'danger' }
    ],
    validations: [
      { rule: 'required', message: 'Inventory status is required' }
    ],
    editComponent: 'dropdown-input'
  },
  {
    field: 'rating',
    header: 'Rating',
    type: 'number',
    sortable: true,
    filterable: true,
    filterType: 'range', // Use range slider for rating filtering
    filterMin: 0,
    filterMax: 5,
    filterStep: 0.1,
    width: '10rem',
    editable: true,
    displayFormat: 'rating',
    validations: [
      { rule: 'min', value: 0, message: 'Rating must be between 0 and 5' },
      { rule: 'max', value: 5, message: 'Rating must be between 0 and 5' }
    ],
    editComponent: 'rating-input'
  }
];

// Action configuration
const productActions: ActionConfig = {
  canAdd: true,
  canEdit: true,
  canDelete: true,
  canBulkDelete: true,
  canExport: true,
  confirmDelete: true,
  actionsColumnWidth: '5rem', // Standard width for Edit + Delete buttons only
  customActions: [] // Removed duplicate action
};

// Search configuration
const productSearch: SearchConfig = {
  enabled: true,
  fields: ['name', 'description'],
  placeholder: 'Search products by name or description...'
};

// Export configuration
const productExport: ExportConfig = {
  enabled: true,
  filename: 'products-export',
  columns: ['id', 'name', 'description', 'category', 'price', 'quantity', 'inventoryStatus', 'rating']
};

// Pagination configuration
const productPagination: PaginationConfig = {
  enabled: true,
  rowsPerPage: 10,
  rowsPerPageOptions: [10, 20, 50, 100],
  showCurrentPageReport: true,
  currentPageReportTemplate: 'Showing {first} to {last} of {totalRecords} products',
  lazy: true // Enable server-side pagination
};

// Complete Product Table Configuration
export const PRODUCT_TABLE_CONFIG: TableManagementConfig<Product> = {
  objectName: 'Product',
  columns: productColumns,
  actions: productActions,
  search: productSearch,
  export: productExport,
  pagination: productPagination,
  dataKey: 'id',
  globalFilterFields: ['name', 'description']
};

// NEW: Function to create complete dashboard tab configuration for products
export function createProductDashboardConfig(
  productHooks: any, 
  adminProductSearch: any, 
  messageService: any
): DashboardTabConfig<Product> {
  
  // Define CRUD operations
  const operations: CrudOperationsConfig<Product> = {
    create: {
      enabled: true,
      handler: async (item: ProductCreateRequest) => {
        await productHooks.createProduct(item);
        return true;
      },
      successMessage: 'Product created successfully',
      errorMessage: 'Failed to create product',
      refreshAfterCreate: true,
      refreshParams: { page: 1, size: 10, sorts: [], filters: {} }
    },
    
    update: {
      enabled: true,
      handler: async (id: number, item: ProductUpdateRequest) => {
        await productHooks.updateProduct(id, item);
        return true;
      },
      successMessage: 'Product updated successfully',
      errorMessage: 'Failed to update product',
      refreshAfterUpdate: true,
      refreshParams: { page: 1, size: 10, sorts: [], filters: {} }
    },
    
    delete: {
      enabled: true,
      handler: async (id: number) => {
        await productHooks.deleteProduct(id);
        // Refresh the product list after deletion
        await adminProductSearch.search({});
        return true;
      },
      successMessage: 'Product deleted successfully',
      errorMessage: 'Failed to delete product',
      confirmMessage: 'Are you sure you want to delete this product?',
      refreshAfterDelete: false // We manually refresh above
    },
    
    bulkDelete: {
      enabled: true,
      handler: async (ids: number[]) => {
        const result = await productHooks.bulkDeleteProducts(ids);
        // Refresh the product list after deletion
        await adminProductSearch.search({});
        return result;
      },
      successMessage: 'Products deleted successfully',
      errorMessage: 'Failed to delete products',
      confirmMessage: 'Are you sure you want to delete the selected products?',
      refreshAfterDelete: false // We manually refresh above
    },
    
    export: {
      enabled: true,
      handler: async () => {
        return adminProductSearch.state().items;
      },
      filename: 'products-export',
      format: 'csv',
      successMessage: 'Products exported successfully',
      errorMessage: 'Failed to export products'
    }
  };
  
  // Define data loader
  const dataLoader: DataLoaderConfig<Product> = {
    handler: async (searchParams: any) => {
      const params: Partial<AdminSearchParams> = {
        page: searchParams.page || 1,
        limit: searchParams.limit || 10,
        ...searchParams
      };
      
      await adminProductSearch.search(params);
      const state = adminProductSearch.state();
      
      return {
        items: state.items,
        total: state.total,
        page: state.page,
        limit: state.limit,
        totalPages: state.totalPages
      };
    },
    searchParamsConverter: (event: any) => {
      return {
        page: event.page || 1,
        size: event.size || 10,
        sorts: event.sorts || [],
        filters: event.filters || {}
      };
    },
    refreshTrigger: async (params?: any) => {
      const refreshParams = params || { page: 1, size: 10, sorts: [], filters: {} };
      await adminProductSearch.search(refreshParams);
    },
    initialParams: { page: 1, limit: 10 }
  };
  
  // Define notifications
  const notifications: NotificationConfig = {
    showSuccessMessages: true,
    showErrorMessages: true,
    successDuration: 3000,
    errorDuration: 5000
  };
  
  return {
    ...PRODUCT_TABLE_CONFIG,
    
    // Enhanced dashboard configuration
    operations,
    dataLoader,
    notifications,
    
    // Tab configuration
    tabTitle: 'Products',
    tabIcon: 'pi pi-box',
    tabOrder: 1,
    
    // Data binding signals
    dataSignal: () => adminProductSearch.state().items,
    loadingSignal: () => adminProductSearch.state().isLoading,
    errorSignal: () => adminProductSearch.state().error,
    
    // Bridge methods for TabManagementComponent compatibility
    createItem: async (item: ProductCreateRequest) => {
      try {
        await productHooks.createProduct(item);
        messageService.add({
          severity: 'success',
          summary: 'Product Created! 🎉',
          detail: `"${item.name}" has been successfully added to your inventory with ${item.quantity} units in stock.`
        });
        // Refresh data
        await adminProductSearch.search({ page: 1, size: 10, sorts: [], filters: {} });
      } catch (error: any) {
        messageService.add({
          severity: 'error',
          summary: 'Creation Failed ❌',
          detail: error.message || 'Unable to create the product. Please check your input and try again.'
        });
        throw error;
      }
    },
    
    updateItem: async (id: number, item: ProductUpdateRequest) => {
      try {
        await productHooks.updateProduct(id, item);
        messageService.add({
          severity: 'success',
          summary: 'Product Updated! ✅',
          detail: `"${item.name}" has been successfully updated with your latest changes.`
        });
        // Refresh data
        await adminProductSearch.search({ page: 1, size: 10, sorts: [], filters: {} });
      } catch (error: any) {
        messageService.add({
          severity: 'error',
          summary: 'Update Failed ❌',
          detail: error.message || 'Unable to update the product. Please check your changes and try again.'
        });
        throw error;
      }
    },
    
    deleteItem: async (id: number) => {
      try {
        const result = await productHooks.deleteProduct(id);
        messageService.add({
          severity: 'success',
          summary: 'Product Deleted! 🗑️',
          detail: `"${result.productName}" has been permanently removed from your inventory.`
        });
        // Refresh data
        await adminProductSearch.search({});
      } catch (error: any) {
        messageService.add({
          severity: 'error',
          summary: 'Deletion Failed ❌',
          detail: error.message || 'Unable to delete the product. It may be referenced in active orders.'
        });
        throw error;
      }
    },
    
    // Add bulk delete compatibility mapping
    bulkDelete: async (ids: number[]) => {
      try {
        const result = await productHooks.bulkDeleteProducts(ids);
        messageService.add({
          severity: 'success',
          summary: 'Products Deleted! 🗑️',
          detail: `Successfully deleted ${ids.length} product${ids.length > 1 ? 's' : ''} from your inventory.`
        });
        // Refresh data
        await adminProductSearch.search({});
        return result;
      } catch (error: any) {
        messageService.add({
          severity: 'error',
          summary: 'Bulk Deletion Failed ❌',
          detail: error.message || 'Unable to delete the selected products. Some may be referenced in active orders.'
        });
        throw error;
      }
    }
  };
}
