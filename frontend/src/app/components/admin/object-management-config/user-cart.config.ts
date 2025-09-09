import { 
  ColumnConfig, 
  ActionConfig, 
  TableManagementConfig,
  DashboardTabConfig,
  CrudOperationsConfig,
  DataLoaderConfig,
  NotificationConfig
} from './table-config.interface';
import { AdminUserCartData, AdminUserCartItem } from '../../../models/user-cart.model';
import { AdminSearchStore } from '../../../stores/admin-search.store';
import { AdminSearchParams } from '../../../models/adminSearch.model';

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
 * - Direct access to user fields: id, username, email, firstname, isActive
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
    field: 'id',
    header: 'User ID',
    type: 'number',
    sortable: true,
    filterable: true,
    width: '10rem'
  },
  {
    field: 'username',
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
    header: 'Active',
    type: 'boolean',
    sortable: true,
    filterable: false,
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
    filterType: 'range',
    filterMin: 0,
    filterStep: 10,
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
      severity: 'danger',
      confirm: true,
      confirmMessage: 'Are you sure you want to clear all items from this user\'s cart? This action cannot be undone.',
      disabled: (item: AdminUserCartData) => {
        // Disable clear cart button if user has no items in their cart
        return !item.cart || item.cart.length === 0;
      }
    }
  ]
};

// Level 1 (Child) - Cart items columns
export const LEVEL_1_CART_ITEMS_COLUMNS: ColumnConfig[] = [
  {
    field: 'productId',
    header: 'Product ID',
    type: 'number',
    sortable: false,
    filterable: false,
    width: '12rem'
  },
  {
    field: 'productName',
    header: 'Product Name',
    type: 'text',
    sortable: false,
    filterable: false,
    width: '12rem',
    editable: true, // Allow editing for new cart items
    editComponent: 'product-select' // Use product select component for new items
  },
  {
    field: 'quantity',
    header: 'Qty',
    type: 'number',
    sortable: false,
    filterable: false,
    width: '14rem',
    editable: true, // Allow editing quantity
    editComponent: 'quantity-controls' // Use quantity controls component
  },
  {
    field: 'productPrice',
    header: 'Unit Price',
    type: 'number',
    displayFormat: 'currency',
    sortable: false,
    filterable: false,
    width: '10rem'
  },
  {
    field: 'productStockQuantity',
    header: 'Stock',
    type: 'number',
    sortable: false,
    filterable: false,
    width: '10rem'
  },
  {
    field: 'subtotal',
    header: 'Subtotal',
    type: 'number',
    displayFormat: 'currency',
    sortable: false,
    filterable: false,
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
          id: userCart.id,
          username: userCart.username,
          email: userCart.email,
          firstname: userCart.firstname,
          isActive: userCart.isActive,
          cartTotalValue: userCart.cartTotalValue,
          cartSummary: `${getTotalItemsCount(userCart.cart)} items, $${userCart.cartTotalValue.toFixed(2)}`,
          
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
            id: userCart.id + '_' + item.productId, // Unique ID for child row
            username: userCart.username,
            email: userCart.email,
            firstname: userCart.firstname,
            isActive: userCart.isActive,
            cartSummary: null, // Not applicable for child rows
            
            // Hierarchy fields
            parentUserId: userCart.id, // References the parent user
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

// Function to create admin user cart configuration with generic child actions
export function createAdminUserCartConfig(cartManagement: any, collapseRowCallback?: (userId: number) => void): TableManagementConfig {
  return {
    objectName: 'User Cart',
    columns: LEVEL_0_USER_COLUMNS, // Use level 0 columns as default
    actions: LEVEL_0_USER_ACTIONS, // Use level 0 actions as default
    dataKey: 'id', // Primary key for each row
    
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

    // NEW: Generic child actions configuration
    childActions: {
      'ADD_CART_ITEM': {
        parentIdField: 'id',
        childTemplate: {
          productId: null,
          selectedProduct: null,
          quantity: 1
        },
        saveHandler: async (userId: number, cartItemData: any): Promise<boolean> => {
          try {
            await cartManagement.addItemToUserCart(userId, {
              productId: cartItemData.productId,
              quantity: cartItemData.quantity || 1
            });
            
            return true;
          } catch (error) {
            console.error('Error adding cart item:', error);
            return false;
          }
        },
        shouldKeepExpandedOnSave: true,
        shouldCollapseOnCancel: (parentData: any) => {
          // Collapse if user has no cart items
          return !parentData.cart || parentData.cart.length === 0;
        },
        childEntityName: 'Cart Item'
      }
    },

    // NEW: Calculated fields for dynamic data
    calculatedFields: {
      subtotal: (data: any) => {
        return (data.productPrice || 0) * (data.quantity || 0);
      },
      cartTotalValue: (data: any) => {
        // Use backend-provided cartTotalValue if available, otherwise calculate
        return data.cartTotalValue || 0;
      }
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
      columns: ['id', 'username', 'email', 'firstname', 'isActive']
    },
    
    // Pagination configuration
    pagination: {
      enabled: true,
      rowsPerPage: 10,
      rowsPerPageOptions: [5, 10, 20, 50],
      showCurrentPageReport: true,
      currentPageReportTemplate: 'Showing {first} to {last} of {totalRecords} carts',
      lazy: true // Enable server-side pagination to match custom dataLoader
    },
    
    // Global filter fields
    globalFilterFields: ['username', 'email', 'firstname']
  };
}

// Main table configuration for admin user cart management with level-based configuration
export const ADMIN_USER_CART_TABLE_CONFIG: TableManagementConfig = {
  objectName: 'User Cart',
  columns: LEVEL_0_USER_COLUMNS, // Use level 0 columns as default
  actions: LEVEL_0_USER_ACTIONS, // Use level 0 actions as default
  dataKey: 'id', // Primary key for each row
  
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
    fields: ['username', 'email', 'firstname'],
    placeholder: 'Search users...'
  },
  
  // Export configuration
  export: {
    enabled: true,
    filename: 'user-carts-export',
    columns: ['id', 'username', 'email', 'firstname', 'isActive']
  },
  
  // Pagination configuration
  pagination: {
    enabled: true,
    rowsPerPage: 10,
    rowsPerPageOptions: [5, 10, 20, 50],
    showCurrentPageReport: true,
    currentPageReportTemplate: 'Showing {first} to {last} of {totalRecords} carts',
    lazy: true // Enable server-side pagination to match backend search pattern
  },
  
  // Global filter fields
  globalFilterFields: ['username', 'email', 'firstname']
};

// Export the main config as default
export default ADMIN_USER_CART_TABLE_CONFIG;

// NEW: Function to create complete dashboard tab configuration for user carts
export function createCartDashboardConfig(
  cartManagement: any, 
  adminCartSearch: any, 
  messageService: any,
  collapseRowCallback?: (itemId: any) => void
): DashboardTabConfig<AdminUserCartData> {
  
  // Get the full config with child actions
  const fullConfig = createAdminUserCartConfig(cartManagement);
  
  // Define CRUD operations
  const operations: CrudOperationsConfig<AdminUserCartData> = {
    create: {
      enabled: false, // Carts are created automatically when users add items
      handler: async () => false,
      errorMessage: 'Cart creation not supported from admin dashboard'
    },
    
    update: {
      enabled: true,
      handler: async (itemData: any) => {
        
        // Handle different types of updates based on item level
        if (itemData.hasOwnProperty('productId') && itemData.hasOwnProperty('parentUserId')) {
          // This is a cart item (level 1) - update quantity and/or product
          const userId = itemData.parentUserId;
          const oldProductId = itemData.productId;
          const newProductId = itemData.newProductId || itemData.productId;
          const quantity = itemData.quantity || 1;
                    
          // Check if we're changing the product or just the quantity
          if (oldProductId !== newProductId) {
            // Product change - use enhanced update with both productId and quantity
            await cartManagement.updateUserCartItem(userId, oldProductId, { 
              productId: newProductId, 
              quantity 
            });
          } else {
            
            // Only proceed if quantity is valid and > 0
            if (quantity > 0) {
              await cartManagement.updateUserCartItem(userId, oldProductId, { quantity });
            } else {
              // If quantity is 0 or negative, remove the item instead
              await cartManagement.removeItemFromUserCart(userId, oldProductId);
            }
          }
        } else if (itemData.hasOwnProperty('userId')) {
          // This is a user (level 0) - clear their entire cart
          const userId = itemData.userId;
          
          await cartManagement.clearUserCart(userId);
        }
        return true;
      },
      successMessage: 'Cart Updated Successfully! 📝',
      errorMessage: 'Cart Update Failed! ❌',
      refreshAfterUpdate: true,
      refreshParams: { page: 1, size: 25, sorts: [], filters: {} }
    },
    
    delete: {
      enabled: true,
      handler: async (itemData: any) => {
        // Handle different types of deletion based on item level
        if (itemData.productId && itemData.parentUserId) {
          // This is a cart item (level 1) - remove from cart
          const userId = itemData.parentUserId;
          const productId = itemData.productId;
          
          await cartManagement.removeItemFromUserCart(userId, productId);
          
          // Force a small delay to ensure backend state is updated
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } else if (itemData.userId && !itemData.parentUserId) {
          // This is a user (level 0) - clear their entire cart
          const userId = itemData.userId;
          
          await cartManagement.clearUserCart(userId);
        } else {
          console.error('❌ CRUD: Invalid item data for deletion:', itemData);
          throw new Error('Invalid item data for deletion');
        }
        
        return true;
      },
      successMessage: 'Item Removed Successfully! 🗑️',
      errorMessage: 'Item Removal Failed! ❌',
      refreshAfterDelete: true,
      onSuccessCallback: (itemData: any) => {
        // Check if this was a cart clearing operation (level 0 user)
        if (itemData.userId && !itemData.parentUserId) {
          // This was a user cart clear - collapse the parent row
          if (collapseRowCallback) {
            collapseRowCallback(itemData.userId);
          }
        }
      }
    },
    
    bulkDelete: {
      enabled: false,
      handler: async () => false,
      errorMessage: 'Bulk cart deletion not supported'
    },
    
    export: {
      enabled: true,
      handler: async () => {
        return adminCartSearch.state().items;
      },
      filename: 'user-carts-export',
      format: 'csv',
      successMessage: 'Cart Data Exported Successfully! 📋',
      errorMessage: 'Cart Export Failed! ❌'
    }
  };
  
  // Define data loader
  const dataLoader: DataLoaderConfig<AdminUserCartData> = {
    handler: async (searchParams: any) => {
      const params: Partial<AdminSearchParams> = {
        page: searchParams.page || 1,
        limit: searchParams.limit || 25,
        filters: searchParams.filters || {},
        sorts: searchParams.sorts || []
      };
      
      await adminCartSearch.search(params);
      const state = adminCartSearch.state();
      
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
        size: event.size || 25,
        limit: event.size || 25,
        sorts: event.sorts || [],
        filters: event.filters || {}
      };
    },
    refreshTrigger: async (params?: any) => {
      const refreshParams = params || { page: 1, size: 25, limit: 25, sorts: [], filters: {}, search: '' };
      await adminCartSearch.search(refreshParams);
    },
    initialParams: { page: 1, limit: 25 }
  };
  
  // Define notifications
  const notifications: NotificationConfig = {
    showSuccessMessages: true,
    showErrorMessages: true,
    successDuration: 3000,
    errorDuration: 5000
  };
  
  return {
    ...fullConfig,
    
    // Enhanced dashboard configuration
    operations,
    dataLoader,
    notifications,
    
    // Tab configuration
    tabTitle: 'User Carts',
    tabIcon: 'pi pi-shopping-cart',
    tabOrder: 3,
    
    // Data binding signals
    dataSignal: () => adminCartSearch.state().items,
    loadingSignal: () => adminCartSearch.state().isLoading,
    errorSignal: () => adminCartSearch.state().error,
    
    // Row control functions
    collapseRow: collapseRowCallback,
    
    // Bridge methods for TabManagementComponent compatibility
    deleteItem: async (itemData: any) => {
      try {
        let userIdToCheck: number | null = null;
        
        // Handle case where itemData is just a string (cart item ID like "3_79")
        if (typeof itemData === 'string' && itemData.includes('_')) {
          const parts = itemData.split('_');
          if (parts.length === 2) {
            const userId = parseInt(parts[0], 10);
            const productId = parseInt(parts[1], 10);
            userIdToCheck = userId;
            
            const result = await cartManagement.removeItemFromUserCart(userId, productId);
          }
        }
        
        // Handle object-based itemData (preferred approach)
        else if (typeof itemData === 'object' && itemData !== null) {
          if (itemData.productId !== undefined && itemData.parentUserId !== undefined) {
            // This is a cart item - use productId and parentUserId
            const userId = itemData.parentUserId;
            const productId = itemData.productId;
            userIdToCheck = userId;
            
            const result = await cartManagement.removeItemFromUserCart(userId, productId);
            
          } else if (itemData.id && !itemData.parentUserId) {
            // This is a user (level 0) - clear their entire cart
            const userId = itemData.id;
            userIdToCheck = userId;
            
            const result = await cartManagement.clearUserCart(userId);
            
            // For cart clearing via deleteItem, show toast message directly
            try {
              messageService.add({
                severity: 'success',
                summary: 'Cart Cleared Successfully! 🛒',
                detail: `All items have been successfully removed from user ${userId}'s shopping cart.`
              });
            } catch (toastError) {
              console.error('❌ deleteItem: Error adding cart cleared toast message:', toastError);
            }
            
          } else {
            console.error('❌ Unable to determine delete type. Expected productId+parentUserId or id without parentUserId');
            console.error('❌ Actual itemData structure:', {
              hasProductId: itemData.productId !== undefined,
              hasParentUserId: itemData.parentUserId !== undefined,
              hasId: itemData.id !== undefined,
              productId: itemData.productId,
              parentUserId: itemData.parentUserId,
              id: itemData.id,
              keys: Object.keys(itemData)
            });
          }
        } else {
          console.error('❌ Invalid itemData format:', itemData);
        }
        
        // Check if we need to collapse the row after deletion
        if (userIdToCheck && collapseRowCallback) {
          // Wait a moment for the backend to update, then check if cart is empty
          setTimeout(async () => {
            try {
              // Refresh data to get updated cart state
              await adminCartSearch.search({ page: 1, size: 25, sorts: [], filters: {} });
              const currentState = adminCartSearch.state();
              
              // Find the user in the updated data
              const userCart = currentState.items.find((item: AdminUserCartData) => item.id === userIdToCheck);
              
              // If user has no cart items left, collapse the row
              if (userCart && (!userCart.cart || userCart.cart.length === 0)) {
                collapseRowCallback(userIdToCheck);
              }
            } catch (error) {
              console.error('❌ Error checking cart state after deletion:', error);
            }
          }, 100);
        }
        
        return true;
      } catch (error) {
        console.error('💥 Error in deleteItem:', error);
        throw error;
      }
    },
    
    executeCustomAction: async (action: string, userId: number) => {
      try {
        if (action === 'clear-cart') {
          await cartManagement.clearUserCart(userId);
          
          // Collapse the parent row since cart is now empty
          if (collapseRowCallback) {
            collapseRowCallback(userId);
          }
          
          // Show success message through messageService (config-based messaging)
          try {
            messageService.add({
              severity: 'success',
              summary: 'Cart Cleared Successfully! 🛒',
              detail: `All items have been successfully removed from user ${userId}'s shopping cart.`
            });
          } catch (toastError) {
            console.error('❌ Error adding toast message:', toastError);
          }
        }
        
        // Refresh the data
        await adminCartSearch.search({ page: 1, size: 25, sorts: [], filters: {} });
        
      } catch (error: any) {
        try {
          messageService.add({
            severity: 'error',
            summary: 'Cart Action Failed! ❌',
            detail: error.message || `Unable to ${action.replace('-', ' ')}. Please try again or check your connection.`
          });
        } catch (toastError) {
          console.error('❌ Error adding error toast message:', toastError);
        }
        
        throw error;
      }
    }
  };
}
