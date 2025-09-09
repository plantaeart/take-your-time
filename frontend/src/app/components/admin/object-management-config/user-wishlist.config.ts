import { 
  ColumnConfig, 
  ActionConfig, 
  TableManagementConfig,
  DashboardTabConfig,
  CrudOperationsConfig,
  DataLoaderConfig,
  NotificationConfig
} from './table-config.interface';
import { AdminUserWishlistData, AdminUserWishlistItem } from '../../../models/user-wishlist.model';
import { AdminSearchParams } from '../../../models/adminSearch.model';

/**
 * ADMIN USER WISHLIST MANAGEMENT - FLATTENED STRUCTURE CONFIGURATION
 * 
 * This configuration implements a simplified wishlist management system using 
 * the new flattened backend structure that combines user information with wishlist data.
 * 
 * FEATURES:
 * - User information displayed directly (no joins required)
 * - Wishlist items shown in expandable rows
 * - Simplified data structure for better performance
 * - Direct access to user fields: id, username, email, firstname, isActive
 * - Wishlist array contains: productId, productName, productPrice, addedAt
 * 
 * DATA SOURCE: /api/admin/wishlist/search (new flattened endpoint)
 */

// Helper function to format date for wishlist items
function formatDateAdded(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
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
    field: 'wishlistItemCount',
    header: 'Items',
    type: 'number',
    sortable: true,
    filterable: true,
    filterType: 'range',
    filterMin: 0,
    filterStep: 1,
    width: '12rem'
  }
];

// Level 0 (Parent) - User actions
export const LEVEL_0_USER_ACTIONS: ActionConfig = {
  canAdd: false, // Cannot add new users from wishlist management
  canEdit: false, // Cannot edit user data from wishlist management
  canDelete: false, // Cannot delete users from wishlist management
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
      label: 'Clear Wishlist',
      icon: 'pi pi-times-circle',
      action: 'clear-wishlist',
      severity: 'danger',
      confirm: true,
      confirmMessage: 'Are you sure you want to clear all items from this user\'s wishlist? This action cannot be undone.',
      disabled: (item: AdminUserWishlistData) => {
        // Disable clear wishlist button if user has no items in their wishlist
        return !item.wishlist || item.wishlist.length === 0;
      }
    }
  ]
};

// Level 1 (Child) - Wishlist items columns
export const LEVEL_1_WISHLIST_ITEMS_COLUMNS: ColumnConfig[] = [
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
    width: '15rem',
    editable: true, // Allow editing for new wishlist items
    editComponent: 'product-select' // Use product select component for new items
  },
  {
    field: 'productPrice',
    header: 'Price',
    type: 'number',
    sortable: false,
    filterable: false,
    filterType: 'range',
    filterMin: 0,
    filterStep: 10,
    width: '10rem',
    displayFormat: 'currency'
  },
  {
    field: 'productStockQuantity',
    header: 'Stock',
    type: 'number',
    sortable: false,
    filterable: false,
    width: '8rem'
  }
];

// Level 1 (Child) - Wishlist item actions
export const LEVEL_1_WISHLIST_ITEMS_ACTIONS: ActionConfig = {
  canAdd: true, // Can add new items to wishlist
  canEdit: true, // Can edit wishlist item properties (enable edit functionality)
  canDelete: true, // Can remove items from wishlist
  canBulkDelete: true,
  canExport: false,
  confirmDelete: true,
  customActions: []
};

// Main table configuration for Admin User Wishlist Management
export const ADMIN_USER_WISHLIST_TABLE_CONFIG: TableManagementConfig = {
  objectName: 'User Wishlist',
  columns: LEVEL_0_USER_COLUMNS, // Use level 0 columns as default
  actions: LEVEL_0_USER_ACTIONS, // Use level 0 actions as default
  dataKey: 'id', // Primary key for each row
  
  // Hierarchy configuration for parent (user) -> child (wishlist items) relationship
  hierarchyConfig: {
    enabled: true,
    parentIdField: 'parentUserId', // Field that contains parent reference (for flattened data)
    childAttributeField: 'wishlist', // NEW: Attribute that contains child array
    loadStrategy: 'eager', // All data loaded upfront
    maxDepth: 2, // User -> Wishlist Items (could be extended)
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
        level: 1, // Child level (wishlist items)
        columns: LEVEL_1_WISHLIST_ITEMS_COLUMNS,
        actions: LEVEL_1_WISHLIST_ITEMS_ACTIONS,
        allowExpansion: false // Wishlist items don't have sub-items
      }
    ]
  },

  // NEW: Generic child actions configuration
  childActions: {
    'ADD_WISHLIST_ITEM': {
      parentIdField: 'id',
      childTemplate: {
        productId: null,
        selectedProduct: null
      },
      saveHandler: async (userId: number, wishlistItemData: any): Promise<boolean> => {
        try {
          // This would need to be implemented when wishlist management is added
          // await wishlistManagement.addItemToUserWishlist(userId, {
          //   productId: wishlistItemData.productId
          // });
          
          return true;
        } catch (error) {
          console.error('Error adding wishlist item:', error);
          return false;
        }
      },
      shouldKeepExpandedOnSave: true,
      shouldCollapseOnCancel: (parentData: any) => {
        // Collapse if user has no wishlist items (same behavior as cart)
        return !parentData.wishlist || parentData.wishlist.length === 0;
      },
      childEntityName: 'Wishlist Item'
    }
  },

  // NEW: Calculated fields for dynamic data
  calculatedFields: {
    wishlistSummary: (data: any) => {
      const itemCount = data.wishlist ? data.wishlist.length : 0;
      return `${itemCount} item${itemCount !== 1 ? 's' : ''}`;
    }
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
    filename: 'user-wishlists-export',
    columns: ['id', 'username', 'email', 'firstname', 'isActive']
  },
  
  // Pagination configuration
  pagination: {
    enabled: true,
    rowsPerPage: 10,
    rowsPerPageOptions: [5, 10, 20, 50],
    showCurrentPageReport: true,
    currentPageReportTemplate: 'Showing {first} to {last} of {totalRecords} wishlists',
    lazy: true // Enable server-side pagination to match backend search pattern
  },
  
  // Global filter fields
  globalFilterFields: ['username', 'email', 'firstname']
};

// Export the main config as default
export default ADMIN_USER_WISHLIST_TABLE_CONFIG;

// NEW: Function to create complete dashboard tab configuration for user wishlists
export function createWishlistDashboardConfig(
  wishlistManagement: any, 
  adminWishlistSearch: any, 
  messageService: any,
  collapseRowCallback?: (itemId: any) => void
): DashboardTabConfig<AdminUserWishlistData> {
  
  return {
    objectName: 'User Wishlist',
    columns: LEVEL_0_USER_COLUMNS,
    actions: LEVEL_0_USER_ACTIONS,
    dataKey: 'id',
    
    // Include hierarchy configuration
    hierarchyConfig: ADMIN_USER_WISHLIST_TABLE_CONFIG.hierarchyConfig,
    
    // Include child actions from main config but override with working save handler
    childActions: {
      'ADD_WISHLIST_ITEM': {
        parentIdField: 'id',
        childTemplate: {
          productId: null,
          selectedProduct: null
        },
        saveHandler: async (userId: number, wishlistItemData: any): Promise<boolean> => {
          try {
            await wishlistManagement.addItemToUserWishlist(userId, {
              productId: wishlistItemData.productId
            });
            
            return true;
          } catch (error) {
            console.error('Error adding wishlist item:', error);
            return false;
          }
        },
        shouldKeepExpandedOnSave: true,
        shouldCollapseOnCancel: (parentData: any) => {
          // Collapse if user has no wishlist items (same behavior as cart)
          return !parentData.wishlist || parentData.wishlist.length === 0;
        },
        childEntityName: 'Wishlist Item'
      }
    },
    
    // CRUD operations configuration
    operations: {
      create: {
        enabled: false,
        handler: async () => false,
        errorMessage: 'Wishlist creation not supported from admin dashboard'
      },
      
      update: {
        enabled: true,
        handler: async (itemData: any) => {
          // Handle different types of updates based on item level
          if (itemData.hasOwnProperty('productId') && itemData.hasOwnProperty('parentUserId')) {
            // This is a wishlist item (level 1) - wishlist items can be edited for product selection
            const userId = itemData.parentUserId;
            const oldProductId = itemData.productId;
            const newProductId = itemData.newProductId || itemData.productId;
            
            // If product ID changed, update the wishlist item
            if (oldProductId !== newProductId) {
              await wishlistManagement.updateUserWishlistItem(userId, oldProductId, newProductId);
            }
          } else if (itemData.hasOwnProperty('userId')) {
            // This is a user (level 0) - clear their entire wishlist
            const userId = itemData.userId;
            await wishlistManagement.clearUserWishlist(userId);
          }
          return true;
        },
        successMessage: 'Wishlist Updated Successfully! 💝',
        errorMessage: 'Wishlist Update Failed! ❌',
        refreshAfterUpdate: true,
        refreshParams: { page: 1, size: 25, sorts: [], filters: {} }
      },
      
      delete: {
        enabled: true,
        handler: async (itemData: any) => {
          // Handle different types of deletion based on item level
          if (itemData.productId && itemData.parentUserId) {
            // This is a wishlist item (level 1) - remove from wishlist
            const userId = itemData.parentUserId;
            const productId = itemData.productId;
            
            await wishlistManagement.removeItemFromUserWishlist(userId, productId);
          } else if (itemData.userId && !itemData.parentUserId) {
            // This is a user (level 0) - clear their entire wishlist
            const userId = itemData.userId;
            await wishlistManagement.clearUserWishlist(userId);
          }
          return true;
        },
        successMessage: 'Item Removed Successfully! 🗑️',
        errorMessage: 'Item Removal Failed! ❌',
        refreshAfterDelete: true,
        onSuccessCallback: (itemData: any) => {
          // Check if this was a wishlist clearing operation (level 0 user)
          if (itemData.userId && !itemData.parentUserId) {
            // This was a user wishlist clear - collapse the parent row
            if (collapseRowCallback) {
              collapseRowCallback(itemData.userId);
            }
          }
        }
      },
      
      bulkDelete: {
        enabled: false,
        handler: async () => false,
        errorMessage: 'Bulk wishlist deletion not supported'
      },
      
      export: {
        enabled: true,
        handler: async () => {
          return adminWishlistSearch.state().items;
        },
        filename: 'user-wishlists-export',
        format: 'csv',
        successMessage: 'Wishlist Data Exported Successfully! 📋',
        errorMessage: 'Wishlist Export Failed! ❌'
      }
    },
    
    // Define notifications
    notifications: {
      showSuccessMessages: true,
      showErrorMessages: true,
      successDuration: 3000,
      errorDuration: 5000
    },
    
    // Data loading functions
    dataLoader: {
      handler: async (searchParams: any) => {
        const params: Partial<AdminSearchParams> = {
          page: searchParams.page || 1,
          limit: searchParams.limit || 25,
          filters: searchParams.filters || {},
          sorts: searchParams.sorts || []
        };
        
        await adminWishlistSearch.search(params);
        const state = adminWishlistSearch.state();
        
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
        await adminWishlistSearch.search(refreshParams);
      },
      initialParams: { page: 1, limit: 25, filters: {}, sorts: [] }
    },
    
    // State signals (will be injected by dashboard)
    dataSignal: () => adminWishlistSearch.state().items,
    loadingSignal: () => adminWishlistSearch.state().isLoading,
    
    // Search, export, pagination configs
    search: ADMIN_USER_WISHLIST_TABLE_CONFIG.search,
    export: ADMIN_USER_WISHLIST_TABLE_CONFIG.export,
    pagination: ADMIN_USER_WISHLIST_TABLE_CONFIG.pagination,
    globalFilterFields: ADMIN_USER_WISHLIST_TABLE_CONFIG.globalFilterFields,
    
    // Tab configuration
    tabTitle: 'User Wishlists',
    tabIcon: 'pi pi-heart',
    tabOrder: 4,
    
    // NEW: CRUD operations for wishlist management
    createItem: async (item: any) => {
      try {
        const success = await wishlistManagement.addItemToUserWishlist(item.userId, { productId: item.productId });
        if (success && collapseRowCallback) {
          collapseRowCallback(item.userId);
        }
        return success;
      } catch (error) {
        console.error('Error adding wishlist item:', error);
        return false;
      }
    },
    
    deleteItem: async (id: any) => {
      try {
        // For wishlist items, id format might be "userId_productId"
        const [userId, productId] = id.toString().split('_').map(Number);
        return await wishlistManagement.removeItemFromUserWishlist(userId, productId);
      } catch (error) {
        console.error('Error removing wishlist item:', error);
        return false;
      }
    },
    
    executeCustomAction: async (action: string, rowData: any) => {
      try {
        switch (action) {
          case 'clear-wishlist':
            const success = await wishlistManagement.clearUserWishlist(rowData.id);
            if (success && collapseRowCallback) {
              collapseRowCallback(rowData.id);
            }
            return success;
            
          case 'add-product':
            messageService.add({
              severity: 'info',
              summary: 'Add Product',
              detail: 'Product selection dialog would open here'
            });
            return true;
            
          default:
            console.warn('Unknown action:', action);
            return false;
        }
      } catch (error) {
        console.error('Error executing custom action:', error);
        return false;
      }
    }
  };
}

// Export main configurations
export const ADMIN_USER_WISHLIST_COLUMNS = LEVEL_0_USER_COLUMNS;
export const ADMIN_USER_WISHLIST_ACTIONS = LEVEL_0_USER_ACTIONS;
export const WISHLIST_ITEMS_COLUMNS = LEVEL_1_WISHLIST_ITEMS_COLUMNS;

// Function to create data loader for wishlist search with proper flat hierarchy structure  
export function createAdminUserWishlistLoader(adminWishlistSearch: any) {
  return async (searchParams: any): Promise<any> => {    
    try {
      const params: Partial<AdminSearchParams> = {
        page: searchParams.page || 1,
        limit: searchParams.limit || 25,
        filters: searchParams.filters || {},
        sorts: searchParams.sorts || []
      };
      
      await adminWishlistSearch.search(params);
      const state = adminWishlistSearch.state();
      
      // For the dashboard, return the original data structure
      // The hierarchy will be handled by the table component when needed
      return {
        items: state.items, // Keep original AdminUserWishlistData structure
        total: state.total,
        page: state.page,
        limit: state.limit,
        totalPages: state.totalPages
      };
    } catch (error) {
      console.error('❌ Error loading admin user wishlists:', error);
      throw error;
    }
  };
}

// Alternative data loader for table management with flat hierarchy structure
export function createAdminUserWishlistTableLoader(adminWishlistSearch: any) {
  return async (searchParams: any): Promise<any> => {
    try {
      const params: Partial<AdminSearchParams> = {
        page: searchParams.page || 1,
        limit: searchParams.limit || 25,
        filters: searchParams.filters || {},
        sorts: searchParams.sorts || []
      };
      
      await adminWishlistSearch.search(params);
      const state = adminWishlistSearch.state();      // Transform data into flat structure with parent-child relationships
      // This creates a flat array where:
      // - Level 0: User records with parentUserId = null
      // - Level 1: Wishlist item records with parentUserId = userId
      const flatData: any[] = [];
      
      state.items.forEach((userWishlist: AdminUserWishlistData) => {
        // Add parent row (user info)
        const parentRow = {
          // User data
          id: userWishlist.id,
          username: userWishlist.username,
          email: userWishlist.email,
          firstname: userWishlist.firstname,
          isActive: userWishlist.isActive,
          wishlistItemCount: userWishlist.wishlistItemCount,
          wishlistSummary: `${userWishlist.wishlistItemCount} items`,
          
          // Hierarchy data
          level: 0,
          parentUserId: null,
          isParent: true,
          hasChildren: true, // Always show fold arrow for all users (like cart behavior)
          
          // Full user wishlist data for actions
          _fullUserWishlistData: userWishlist
        };
        
        flatData.push(parentRow);
        
        // Add child rows (wishlist items)
        if (userWishlist.wishlist && userWishlist.wishlist.length > 0) {
          userWishlist.wishlist.forEach((item: AdminUserWishlistItem, index: number) => {
            const childRow = {
              // Wishlist item data
              productId: item.productId,
              productName: item.productName,
              productPrice: item.productPrice,
              productStockQuantity: item.productStockQuantity,
              addedAt: item.addedAt,
              
              // Hierarchy data
              id: `${userWishlist.id}_item_${index}`, // Unique ID for child row
              level: 1,
              parentUserId: userWishlist.id,
              isParent: false,
              hasChildren: false,
              
              // Full item data for actions
              _fullWishlistItemData: item,
              _parentUserData: userWishlist
            };
            
            flatData.push(childRow);
          });
        }
      });
      
      return {
        items: flatData,
        total: state.total,
        page: state.page,
        limit: state.limit,
        totalPages: state.totalPages
      };
    } catch (error) {
      console.error('❌ Error loading admin user wishlist table:', error);
      throw error;
    }
  };
}
