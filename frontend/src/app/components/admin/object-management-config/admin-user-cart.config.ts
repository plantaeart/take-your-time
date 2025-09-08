import { ColumnConfig, ActionConfig, TableManagementConfig } from './table-config.interface';
import { AdminUserCartData, AdminUserCartItem } from '../../../models/admin-user-cart.model';
import { AdminSearchStore } from '../../../stores/admin-search.store';

/**
 * ADMIN USER CART MANAGEMENT - FLATTENED STRUCTURE CONFIGURATION
 * 
 * This configuration implements a simplified cart management system using 
 * the new flattened backend structure that combines user information with cart data.
 * 
 * FEATURES:
 * - User information displayed directly (no joins required)
 * - Cart items shown in expandable rows
 * - Simplified data structure for better performance
 * - Direct access to user fields: userId, userName, email, firstname, isActive
 * - Cart array contains: productId, productName, quantity, productPrice
 * 
 * DATA SOURCE: /api/admin/cart/search (new flattened endpoint)
 */

// Helper function to calculate total value for a cart
function calculateCartTotalValue(cart: AdminUserCartItem[]): number {
  return cart.reduce((total, item) => total + (item.quantity * item.productPrice), 0);
}

// Helper function to get total items count
function getTotalItemsCount(cart: AdminUserCartItem[]): number {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

// Level 0 (Parent) - User information columns
export const LEVEL_0_USER_COLUMNS: ColumnConfig[] = [
  {
    field: 'userId',
    header: 'User ID',
    type: 'number',
    sortable: true,
    filterable: true,
    width: '10rem'
  },
  {
    field: 'userName',
    header: 'Username',
    type: 'text',
    sortable: true,
    filterable: true,
    width: '12rem'
  },
  {
    field: 'email',
    header: 'Email',
    type: 'text',
    sortable: true,
    filterable: true,
    width: '12.5rem'
  },
  {
    field: 'firstname',
    header: 'First Name',
    type: 'text',
    sortable: true,
    filterable: true,
    width: '12rem'
  },
  {
    field: 'isActive',
    header: 'Status',
    type: 'boolean',
    sortable: true,
    filterable: true,
    width: '10rem',
    options: [
      { label: 'Active', value: true, color: 'success' },
      { label: 'Inactive', value: false, color: 'danger' }
    ]
  },
  {
    field: 'cartTotalValue',
    header: 'Cart Total',
    type: 'number',
    sortable: true,
    filterable: true,
    width: '10rem',
    displayFormat: 'currency'
  }
];

// Level 0 (Parent) - User actions
export const LEVEL_0_USER_ACTIONS: ActionConfig = {
  canAdd: false, // Cannot add new users from cart management
  canEdit: false, // Cannot edit user data from cart management
  canDelete: false, // Cannot delete users from cart management
  canBulkDelete: false,
  canExport: true,
  confirmDelete: false,
  customActions: [
    {
      label: 'Add Product',
      icon: 'pi pi-plus',
      action: 'add-product',
      severity: 'success'
    },
    {
      label: 'Clear Cart',
      icon: 'pi pi-shopping-cart',
      action: 'clear-cart',
      severity: 'danger'
    }
  ]
};

// Level 1 (Child) - Cart items columns
export const LEVEL_1_CART_ITEMS_COLUMNS: ColumnConfig[] = [
  {
    field: 'productId',
    header: 'Product ID',
    type: 'number',
    sortable: true,
    filterable: true,
    width: '12rem'
  },
  {
    field: 'productName',
    header: 'Product Name',
    type: 'text',
    sortable: true,
    filterable: true,
    width: '12rem',
    editable: true, // Allow editing for new cart items
    editComponent: 'product-select' // Use product select component for new items
  },
  {
    field: 'quantity',
    header: 'Qty',
    type: 'number',
    sortable: true,
    filterable: true,
    width: '14rem',
    editable: true, // Allow editing quantity
    editComponent: 'quantity-controls' // Use quantity controls component
  },
  {
    field: 'productPrice',
    header: 'Unit Price',
    type: 'number',
    displayFormat: 'currency',
    sortable: true,
    filterable: true,
    width: '10rem'
  },
  {
    field: 'productStockQuantity',
    header: 'Stock',
    type: 'number',
    sortable: true,
    filterable: true,
    width: '10rem'
  },
  {
    field: 'subtotal',
    header: 'Subtotal',
    type: 'number',
    displayFormat: 'currency',
    sortable: true,
    filterable: true,
    width: '10rem'
  }
];

// Level 1 (Child) - Cart items actions
export const LEVEL_1_CART_ITEMS_ACTIONS: ActionConfig = {
  canAdd: false, // Items added through parent actions
  canEdit: true, // Edit quantity
  canDelete: true, // Remove item from cart
  canBulkDelete: false, // Don't allow bulk delete of cart items
  canExport: false,
  confirmDelete: true,
  customActions: [] // Remove duplicate actions since we have edit and delete buttons
};

// Legacy exports for backward compatibility (will be removed)
export const ADMIN_USER_CART_COLUMNS = LEVEL_0_USER_COLUMNS;
export const ADMIN_USER_CART_ACTIONS = LEVEL_0_USER_ACTIONS;
export const CART_ITEMS_COLUMNS = LEVEL_1_CART_ITEMS_COLUMNS;

// Function to create data loader for cart search with proper flat hierarchy structure
export function createAdminUserCartLoader(adminSearchStore: AdminSearchStore) {
  return async (searchParams: any): Promise<any> => {    
    try {
      await adminSearchStore.searchCarts(searchParams);
      const state = adminSearchStore.cartsState();
      
      // For the dashboard, return the original data structure
      // The hierarchy will be handled by the table component when needed
      return {
        items: state.items, // Keep original AdminUserCartData structure
        total: state.total,
        page: state.page,
        limit: state.limit,
        totalPages: state.totalPages
      };
    } catch (error) {
      console.error('❌ Error loading admin user carts:', error);
      throw error;
    }
  };
}

// Alternative data loader for table management with flat hierarchy structure
export function createAdminUserCartTableLoader(adminSearchStore: AdminSearchStore) {
  return async (searchParams: any): Promise<any> => {    
    try {
      await adminSearchStore.searchCarts(searchParams);
      const state = adminSearchStore.cartsState();
      
      // Transform data into flat structure with parent-child relationships
      // This creates a flat array where:
      // - Level 0: User records with parentUserId = null
      // - Level 1: Cart item records with parentUserId = userId
      const flatData: any[] = [];
      
      state.items.forEach((userCart: AdminUserCartData) => {
        // Add parent row (user info)
        const parentRow = {
          // User data
          userId: userCart.userId,
          userName: userCart.userName,
          email: userCart.email,
          firstname: userCart.firstname,
          isActive: userCart.isActive,
          cartSummary: `${getTotalItemsCount(userCart.cart)} items, $${calculateCartTotalValue(userCart.cart).toFixed(2)}`,
          
          // Hierarchy fields
          parentUserId: null, // This is a parent row
          level: 0,
          itemType: 'user', // Distinguish between user and cart item rows
          
          // Cart item fields (null for parent rows)
          productId: null,
          productName: null,
          quantity: null,
          productPrice: null,
          subtotal: null
        };
        
        flatData.push(parentRow);
        
        // Add child rows (cart items)
        userCart.cart.forEach((item: AdminUserCartItem) => {
          const childRow = {
            // User data (inherited from parent for context)
            userId: userCart.userId + '_' + item.productId, // Unique ID for child row
            userName: userCart.userName,
            email: userCart.email,
            firstname: userCart.firstname,
            isActive: userCart.isActive,
            cartSummary: null, // Not applicable for child rows
            
            // Hierarchy fields
            parentUserId: userCart.userId, // References the parent user
            level: 1,
            itemType: 'cart_item',
            
            // Cart item fields
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            productPrice: item.productPrice,
            subtotal: item.quantity * item.productPrice
          };
          
          flatData.push(childRow);
        });
      });
      
      return {
        items: flatData,
        total: state.total,
        page: state.page,
        limit: state.limit,
        totalPages: state.totalPages
      };
    } catch (error) {
      console.error('❌ Error loading admin user carts for table:', error);
      throw error;
    }
  };
}

// Main table configuration for admin user cart management with level-based configuration
export const ADMIN_USER_CART_TABLE_CONFIG: TableManagementConfig = {
  objectName: 'User Cart',
  columns: LEVEL_0_USER_COLUMNS, // Use level 0 columns as default
  actions: LEVEL_0_USER_ACTIONS, // Use level 0 actions as default
  dataKey: 'userId', // Primary key for each row
  
  // Hierarchy configuration for parent (user) -> child (cart items) relationship
  hierarchyConfig: {
    enabled: true,
    parentIdField: 'parentUserId', // Field that contains parent reference (for flattened data)
    childAttributeField: 'cart', // NEW: Attribute that contains child array
    loadStrategy: 'eager', // All data loaded upfront
    maxDepth: 2, // User -> Cart Items (could be extended)
    indentSize: 40, // Pixels to indent each hierarchy level
    expandIcon: 'pi pi-chevron-right',
    collapseIcon: 'pi pi-chevron-down',
    childDataLoader: async (parentId: number) => {
      // Not used since strategy is 'eager' and we use childAttributeField
      return [];
    },
    levelConfigs: [
      {
        level: 0, // Parent level (users)
        columns: LEVEL_0_USER_COLUMNS,
        actions: LEVEL_0_USER_ACTIONS,
        allowExpansion: true
      },
      {
        level: 1, // Child level (cart items)
        columns: LEVEL_1_CART_ITEMS_COLUMNS,
        actions: LEVEL_1_CART_ITEMS_ACTIONS,
        allowExpansion: false // Cart items don't have sub-items
      }
    ]
  },
  
  // Search configuration
  search: {
    enabled: true,
    fields: ['userName', 'email', 'firstname'],
    placeholder: 'Search users...'
  },
  
  // Export configuration
  export: {
    enabled: true,
    filename: 'user-carts-export',
    columns: ['userId', 'userName', 'email', 'firstname', 'isActive']
  },
  
  // Pagination configuration
  pagination: {
    enabled: true,
    rowsPerPage: 10,
    rowsPerPageOptions: [5, 10, 20, 50],
    showCurrentPageReport: true,
    currentPageReportTemplate: 'Showing {first} to {last} of {totalRecords} carts',
    lazy: false // Client-side pagination like other configs
  },
  
  // Global filter fields
  globalFilterFields: ['userName', 'email', 'firstname']
};

// Export the main config as default
export default ADMIN_USER_CART_TABLE_CONFIG;
