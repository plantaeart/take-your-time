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
  condition?: (item: any) => boolean;
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
  
  // CRUD Operations - will be provided by the component using this config
  loadData?: (page: number, limit: number, filters: any) => Promise<{ data: T[]; total: number }>;
  createItem?: (item: any) => Promise<any>;
  updateItem?: (id: any, item: any) => Promise<any>;
  deleteItem?: (id: any) => Promise<any>;
  bulkDelete?: (ids: any[]) => Promise<any>;
  exportData?: () => Promise<T[]>;
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
