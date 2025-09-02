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
    ],
    editComponent: 'currency-input'
  },ration
 */

import { TableManagementConfig, ColumnConfig, ActionConfig, SearchConfig, ExportConfig, PaginationConfig } from './table-config.interface';
import { Product } from '../../../models/product.model';
import { Category } from '../../../enums/category.enum';
import { InventoryStatus } from '../../../enums/inventory-status.enum';

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
  customActions: [
    {
      label: 'Duplicate',
      icon: 'pi pi-copy',
      action: 'duplicate',
      severity: 'info',
      condition: (product: Product) => product.quantity > 0
    }
  ]
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
