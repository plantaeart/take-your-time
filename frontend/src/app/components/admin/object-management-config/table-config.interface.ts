/**
 * Table Management Configuration Interfaces
 * Following Angular 18 best practices with comprehensive typing
 */

export type ColumnType = 'text' | 'number' | 'enum' | 'date' | 'boolean' | 'image' | 'actions';
export type FilterType = 'text' | 'number' | 'dropdown' | 'multiselect' | 'daterange' | 'boolean' | 'range';
export type ValidationRule = 'required' | 'email' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern';

export interface ValidationConfig {
  rule: ValidationRule;
  value?: any;
  message: string;
}

export interface ColumnConfig {
  field: string;
  header: string;
  type: ColumnType;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: FilterType;
  width?: string;
  editable?: boolean;
  required?: boolean;
  validations?: ValidationConfig[];
  options?: { label: string; value: any; color?: string }[]; // For enum types
  displayFormat?: string; // For formatting display values
  editComponent?: string; // Component to use for editing
  // Range filter configuration
  filterMin?: number; // Minimum value for range filters
  filterMax?: number; // Maximum value for range filters
  filterStep?: number; // Step size for range filters
  // Hierarchy configuration
  hierarchyLevel?: number; // Visual indentation level (0 = root, 1 = first child, etc.)
  parentField?: string; // Field that references parent ID for building hierarchy
}

export interface ActionConfig {
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canBulkDelete?: boolean;
  canExport?: boolean;
  confirmDelete?: boolean;
  customActions?: CustomActionConfig[];
}

export interface CustomActionConfig {
  label: string;
  icon: string;
  action: string;
  severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'help' | 'danger';
  disabled?: (item: any) => boolean; // Function to determine if action should be disabled
  confirm?: boolean; // Whether to show confirmation dialog before executing
  confirmMessage?: string; // Custom confirmation message
}

export interface SearchConfig {
  enabled: boolean;
  fields: string[]; // Fields to search in
  placeholder?: string;
}

export interface ExportConfig {
  enabled: boolean;
  filename?: string;
  columns?: string[]; // Fields to export, if empty exports all visible columns
}

export interface PaginationConfig {
  enabled: boolean;
  rowsPerPage: number;
  rowsPerPageOptions: number[];
  showCurrentPageReport?: boolean;
  currentPageReportTemplate?: string;
  lazy?: boolean; // Enable server-side pagination (lazy loading)
}

export interface TableManagementConfig<T = any> {
  objectName: string; // 'Product', 'User', etc.
  columns: ColumnConfig[];
  actions: ActionConfig;
  search: SearchConfig;
  export: ExportConfig;
  pagination: PaginationConfig;
  dataKey: string; // Primary key field
  globalFilterFields?: string[];
  
  // N-Level Hierarchy Configuration
  hierarchyConfig?: HierarchyConfig<T>;
  
  // NEW: Generic child action configurations
  childActions?: {
    [actionType: string]: ChildActionConfig;
  };
  
  // NEW: Calculated field functions
  calculatedFields?: {
    [fieldName: string]: (item: any, allData?: any[]) => any;
  };
  
  // CRUD Operations - will be provided by the component using this config
  loadData?: (page: number, limit: number, filters: any) => Promise<{ data: T[]; total: number }>;
  createItem?: (item: any) => Promise<any>;
  updateItem?: (id: any, item: any) => Promise<any>;
  deleteItem?: (id: any) => Promise<any>;
  bulkDelete?: (ids: any[]) => Promise<any>;
  exportData?: () => Promise<T[]>;
  executeCustomAction?: (action: string, id: any) => Promise<any>;
}

// Enhanced hierarchy configuration for N-level depth
export interface HierarchyConfig<T = any> {
  enabled: boolean;
  maxDepth?: number; // Maximum depth levels (undefined = unlimited)
  parentIdField: string; // Field that contains parent ID (e.g., 'parentId', 'userId') - for flattened data
  levelField?: string; // Optional field that explicitly stores hierarchy level
  
  // NEW: Support for attribute-based hierarchy (nested arrays)
  childAttributeField?: string; // Field that contains child array (e.g., 'cart', 'children')
  
  // Child data loading strategies
  loadStrategy: 'lazy' | 'eager' | 'hybrid';
  childDataLoader: (parentId: any, level: number) => Promise<T[]>;
  
  // Visual configuration
  indentSize?: number; // Pixels per hierarchy level (default: 20)
  expandIcon?: string; // Icon for expandable rows (default: 'pi pi-chevron-right')
  collapseIcon?: string; // Icon for collapsible rows (default: 'pi pi-chevron-down')
  
  // Level-specific configurations
  levelConfigs?: LevelConfig<T>[]; // Different configs per hierarchy level
}

// Configuration for specific hierarchy levels
export interface LevelConfig<T = any> {
  level: number; // Hierarchy level (0 = root, 1 = first child, etc.)
  columns?: ColumnConfig[]; // Override columns for this level
  actions?: ActionConfig; // Override actions for this level
  pagination?: PaginationConfig; // Override pagination for this level
  search?: SearchConfig; // Override search for this level
  rowClass?: string; // CSS class for rows at this level
  allowExpansion?: boolean; // Whether rows at this level can be expanded
}

// NEW: Configuration for child actions (like adding cart items to users)
export interface ChildActionConfig {
  parentIdField: string; // Field in parent entity that identifies it (e.g., 'userId')
  childTemplate: any; // Default template for new child entity
  saveHandler: (parentId: any, childData: any) => Promise<boolean>; // Function to save the child
  shouldKeepExpandedOnSave: boolean; // Whether to keep parent expanded after successful save
  shouldCollapseOnCancel: (parentData: any) => boolean; // Function to determine if parent should collapse on cancel
  childEntityName?: string; // Display name for the child entity (e.g., 'Cart Item')
}

// NEW: Complete CRUD operations configuration for enhanced admin dashboard
export interface CrudOperationsConfig<T = any> {
  create?: {
    enabled: boolean;
    handler: (item: any) => Promise<any>;
    successMessage?: string;
    errorMessage?: string;
    refreshAfterCreate?: boolean;
    refreshParams?: any; // Parameters to pass to refresh function
  };
  
  update?: {
    enabled: boolean;
    handler: (id: any, item: any) => Promise<any>;
    successMessage?: string;
    errorMessage?: string;
    refreshAfterUpdate?: boolean;
    refreshParams?: any;
    onSuccessCallback?: (itemData: any) => void; // Callback after successful operation
  };
  
  delete?: {
    enabled: boolean;
    handler: (id: any) => Promise<any>;
    successMessage?: string;
    errorMessage?: string;
    confirmMessage?: string;
    refreshAfterDelete?: boolean;
    refreshParams?: any;
    onSuccessCallback?: (itemData: any) => void; // Callback after successful operation
  };
  
  bulkDelete?: {
    enabled: boolean;
    handler: (ids: any[]) => Promise<any>;
    successMessage?: string;
    errorMessage?: string;
    confirmMessage?: string;
    refreshAfterDelete?: boolean;
    refreshParams?: any;
  };
  
  export?: {
    enabled: boolean;
    handler: () => Promise<T[]>;
    filename?: string;
    format?: 'csv' | 'excel' | 'json';
    successMessage?: string;
    errorMessage?: string;
  };
}

// NEW: Data loading configuration for admin dashboard
export interface DataLoaderConfig<T = any> {
  handler: (searchParams: any) => Promise<{ 
    items: T[]; 
    total: number; 
    page?: number; 
    limit?: number; 
    totalPages?: number 
  }>;
  searchParamsConverter?: (event: any) => any; // Convert UI event to search params
  refreshTrigger?: (params?: any) => Promise<void>; // Function to trigger data refresh
  initialParams?: any; // Default parameters for initial load
}

// NEW: Notification configuration for admin dashboard
export interface NotificationConfig {
  showSuccessMessages?: boolean;
  showErrorMessages?: boolean;
  successDuration?: number; // in milliseconds
  errorDuration?: number; // in milliseconds
  customMessages?: {
    create?: { success?: string; error?: string };
    update?: { success?: string; error?: string };
    delete?: { success?: string; error?: string };
    bulkDelete?: { success?: string; error?: string };
    export?: { success?: string; error?: string };
  };
}

// NEW: Enhanced dashboard tab configuration
export interface DashboardTabConfig<T = any> extends TableManagementConfig<T> {
  // Enhanced CRUD operations
  operations?: CrudOperationsConfig<T>;
  
  // Data loading configuration
  dataLoader?: DataLoaderConfig<T>;
  
  // Notification configuration
  notifications?: NotificationConfig;
  
  // Tab-specific configuration
  tabTitle?: string;
  tabIcon?: string;
  tabOrder?: number;
  
  // Data binding for the dashboard
  dataSignal?: () => T[]; // Signal containing the data
  loadingSignal?: () => boolean; // Signal indicating loading state
  errorSignal?: () => string | null; // Signal for error state
  
  // Row control functions
  collapseRow?: (itemId: any) => void; // Function to collapse a specific row
  expandRow?: (itemId: any) => void; // Function to expand a specific row
}
