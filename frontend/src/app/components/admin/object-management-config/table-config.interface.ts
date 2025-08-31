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
  
  // CRUD Operations - will be provided by the component using this config
  loadData?: (page: number, limit: number, filters: any) => Promise<{ data: T[]; total: number }>;
  createItem?: (item: any) => Promise<any>;
  updateItem?: (id: any, item: any) => Promise<any>;
  deleteItem?: (id: any) => Promise<any>;
  bulkDelete?: (ids: any[]) => Promise<any>;
  exportData?: () => Promise<T[]>;
}
