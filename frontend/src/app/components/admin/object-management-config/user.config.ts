import { TableManagementConfig, ColumnConfig, ActionConfig, SearchConfig, ExportConfig, PaginationConfig } from './table-config.interface';
import { User } from '../../../models/user.model';

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
