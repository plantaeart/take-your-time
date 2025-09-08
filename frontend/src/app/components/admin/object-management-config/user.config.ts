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
import { User } from '../../../models/user.model';
import { AdminSearchParams } from '../../../models/adminSearch.model';

// Column definitions for User table
const userColumns: ColumnConfig[] = [
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
    field: 'username',
    header: 'Username',
    type: 'text',
    sortable: true,
    filterable: true,
    filterType: 'text',
    width: '12rem',
    editable: true,
    required: true,
    validations: [
      { rule: 'minLength', value: 3, message: 'Username must be at least 3 characters long' },
      { rule: 'maxLength', value: 50, message: 'Username cannot exceed 50 characters' },
      { rule: 'pattern', value: '^[a-zA-Z0-9_-]+$', message: 'Username can only contain letters, numbers, underscores, and hyphens' }
    ]
  },
  {
    field: 'email',
    header: 'Email',
    type: 'text',
    sortable: true,
    filterable: true,
    filterType: 'text',
    width: '14rem',
    editable: true,
    required: true,
    validations: [
      { rule: 'email', message: 'Please enter a valid email address' }
    ]
  },
  {
    field: 'isActive',
    header: 'Active',
    type: 'boolean',
    sortable: true,
    filterable: true,
    filterType: 'boolean',
    width: '10rem',
    editable: true,
    editComponent: 'checkbox-input'
  },
  {
    field: 'isAdmin',
    header: 'Admin',
    type: 'boolean',
    sortable: true,
    filterable: true,
    filterType: 'boolean',
    width: '10rem',
    editable: false, // Read-only for security
    editComponent: 'checkbox-input'
  },
  {
    field: 'createdAt',
    header: 'Created At',
    type: 'date',
    sortable: true,
    filterable: true,
    filterType: 'daterange',
    width: '14rem',
    editable: false
  },
  {
    field: 'updatedAt',
    header: 'Updated At',
    type: 'date',
    sortable: true,
    filterable: true,
    filterType: 'daterange',
    width: '14rem',
    editable: false
  }
];

// Action configuration for User table
const userActions: ActionConfig = {
  canAdd: false, // Users register via public registration
  canEdit: true,
  canDelete: true,
  canBulkDelete: true,
  canExport: true,
  confirmDelete: true,
  customActions: [] // Removed activate/deactivate actions
};

// Search configuration
const userSearch: SearchConfig = {
  enabled: true,
  placeholder: 'Search users by username, email...',
  fields: ['username', 'email']
};

// Export configuration
const userExport: ExportConfig = {
  enabled: true,
  filename: 'users-export',
  columns: ['id', 'username', 'email', 'isActive', 'isAdmin', 'createdAt'] // Don't export updatedAt
};

// Pagination configuration
const userPagination: PaginationConfig = {
  enabled: true,
  rowsPerPage: 25,
  rowsPerPageOptions: [10, 25, 50, 100],
  showCurrentPageReport: true,
  currentPageReportTemplate: 'Showing {first} to {last} of {totalRecords} users'
};

export const USER_TABLE_CONFIG: TableManagementConfig<User> = {
  objectName: 'User',
  columns: userColumns,
  actions: userActions,
  search: userSearch,
  export: userExport,
  pagination: userPagination,
  dataKey: 'id',
  globalFilterFields: ['username', 'email']
};

// NEW: Function to create complete dashboard tab configuration for users
export function createUserDashboardConfig(
  userManagement: any, 
  adminUserSearch: any, 
  messageService: any
): DashboardTabConfig<User> {
  
  // Define CRUD operations
  const operations: CrudOperationsConfig<User> = {
    create: {
      enabled: false, // Users cannot be created from admin dashboard
      handler: async () => false,
      errorMessage: 'User creation not supported from admin dashboard'
    },
    
    update: {
      enabled: true,
      handler: async (id: number, action: string) => {
        if (action === 'activate') {
          await userManagement.activateUser(id);
        } else if (action === 'deactivate') {
          await userManagement.deactivateUser(id);
        }
        return true;
      },
      successMessage: 'User updated successfully',
      errorMessage: 'Failed to update user',
      refreshAfterUpdate: true,
      refreshParams: { page: 1, size: 25, sorts: [], filters: {} }
    },
    
    delete: {
      enabled: false, // Users cannot be deleted, only deactivated
      handler: async () => false,
      errorMessage: 'User deletion not supported. Use deactivate instead.'
    },
    
    bulkDelete: {
      enabled: false,
      handler: async () => false,
      errorMessage: 'Bulk user deletion not supported'
    },
    
    export: {
      enabled: true,
      handler: async () => {
        return adminUserSearch.state().items;
      },
      filename: 'users-export',
      format: 'csv',
      successMessage: 'Users exported successfully',
      errorMessage: 'Failed to export users'
    }
  };
  
  // Define data loader
  const dataLoader: DataLoaderConfig<User> = {
    handler: async (searchParams: any) => {
      const params: Partial<AdminSearchParams> = {
        page: searchParams.page || 1,
        limit: searchParams.limit || 25,
        ...searchParams
      };
      
      await adminUserSearch.search(params);
      const state = adminUserSearch.state();
      
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
        sorts: event.sorts || [],
        filters: event.filters || {}
      };
    },
    refreshTrigger: async (params?: any) => {
      const refreshParams = params || { page: 1, size: 25, sorts: [], filters: {} };
      await adminUserSearch.search(refreshParams);
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
    ...USER_TABLE_CONFIG,
    
    // Enhanced dashboard configuration
    operations,
    dataLoader,
    notifications,
    
    // Tab configuration
    tabTitle: 'Users',
    tabIcon: 'pi pi-users',
    tabOrder: 2,
    
    // Data binding signals
    dataSignal: () => adminUserSearch.state().items,
    loadingSignal: () => adminUserSearch.state().isLoading,
    errorSignal: () => adminUserSearch.state().error,
    
    // Bridge methods for TabManagementComponent compatibility
    updateItem: async (id: number, item: Partial<User>) => {
      try {
        await userManagement.updateUser(id, item);
        const userName = item.username || item.firstname || `User #${id}`;
        messageService.add({
          severity: 'success',
          summary: 'User Updated! ✅',
          detail: `Profile for "${userName}" has been successfully updated with the latest information.`
        });
        // Refresh data
        await adminUserSearch.search({ page: 1, size: 25, sorts: [], filters: {} });
      } catch (error: any) {
        messageService.add({
          severity: 'error',
          summary: 'Update Failed ❌',
          detail: error.message || 'Unable to update user profile. Please check the information and try again.'
        });
        throw error;
      }
    },
    
    deleteItem: async (id: number) => {
      try {
        const result = await userManagement.deleteUser(id);
        messageService.add({
          severity: 'success',
          summary: 'User Deleted! 🗑️',
          detail: 'User account has been permanently removed from the system.'
        });
        // Refresh data
        await adminUserSearch.search({});
      } catch (error: any) {
        messageService.add({
          severity: 'error',
          summary: 'Deletion Failed ❌',
          detail: error.message || 'Unable to delete user account. The user may have active orders or dependencies.'
        });
        throw error;
      }
    },
    
    executeCustomAction: async (action: string, id: number) => {
      try {
        if (action === 'activate') {
          await userManagement.activateUser(id);
          messageService.add({
            severity: 'success',
            summary: 'User Activated! 🟢',
            detail: 'User account has been activated and can now access the system.'
          });
        } else if (action === 'deactivate') {
          await userManagement.deactivateUser(id);
          messageService.add({
            severity: 'success',
            summary: 'User Deactivated! 🔴',
            detail: 'User account has been deactivated and access has been restricted.'
          });
        }
        // Refresh data
        await adminUserSearch.search({ page: 1, size: 25, sorts: [], filters: {} });
      } catch (error: any) {
        messageService.add({
          severity: 'error',
          summary: `${action.charAt(0).toUpperCase() + action.slice(1)} Failed ❌`,
          detail: error.message || `Unable to ${action} user account. Please try again or contact support.`
        });
        throw error;
      }
    }
  };
}
