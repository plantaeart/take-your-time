import { Component, OnInit, input, signal, computed, ViewChild, TemplateRef, output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableManagementConfig, ColumnConfig, FilterType, HierarchyConfig, LevelConfig, ChildActionConfig } from '../object-management-config/table-config.interface';
import { RowTabComponent } from '../row-tab/row-tab.component';
import { TabColumnsHeaderComponent } from '../tab-columns-header/tab-columns-header.component';
import { ButtonConfirmPopupComponent, FilterButtonConfig } from '../../ui/button-confirm-popup/button-confirm-popup.component';
import { GlobalSearchComponent } from '../../ui/global-search/global-search.component';
import { useAdminCart } from '../../../hooks/admin-cart.hooks';

interface FilterState {
  [key: string]: any;
}

interface SortState {
  field: string;
  order: 'asc' | 'desc';
}

// Enhanced interface for hierarchical data items
interface HierarchicalItem<T = any> {
  data: T;
  level: number;
  parentId?: any;
  children?: HierarchicalItem<T>[];
  expanded?: boolean;
  loading?: boolean;
  hasChildren?: boolean;
}

@Component({
  selector: 'app-tab-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    PaginatorModule,
    TooltipModule,
    ToastModule,
    ConfirmDialogModule,
    RowTabComponent,
    TabColumnsHeaderComponent,
    GlobalSearchComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './tab-management.component.html',
  styleUrl: './tab-management.component.css'
})
export class TabManagementComponent<T = any> implements OnInit {
  // Services
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  
  // Admin cart hooks for handling cart-specific actions
  private adminCart = useAdminCart();

  // Inputs
  config = input.required<TableManagementConfig<T>>();
  data = input<T[]>([]);
  loading = input<boolean>(false);
  totalRecordsInput = input<number>(0); // Total records from server for lazy loading

  // Outputs (events for parent to handle)
  dataLoad = output<{
    page: number;
    size: number;
    sorts: { field: string; direction: 'asc' | 'desc' }[];
    filters: FilterState;
  }>();

  // Internal state
  selectedItems = signal<T[]>([]);
  isCreatingNew = signal<boolean>(false);
  newItem = signal<Partial<T>>({});
  editingItem = signal<T | null>(null);
  editItemData = signal<Partial<T>>({});
  globalFilterValue = signal<string>('');
  
  // Generic child action state (replaces cart-specific signals)
  currentChildAction = signal<{
    type: string;
    parentId: any;
    data: any;
  } | null>(null);
  newChildData = signal<any>({});
  
  // Hierarchical data state
  hierarchicalData = signal<HierarchicalItem<T>[]>([]);
  expandedItems = signal<Set<any>>(new Set());
  loadingChildren = signal<Set<any>>(new Set());
  
  // Check if hierarchy is enabled
  isHierarchyEnabled = computed(() => 
    this.config().hierarchyConfig?.enabled || false
  );
  
  // Get hierarchy configuration
  hierarchyConfig = computed(() => 
    this.config().hierarchyConfig || null
  );
  
  // Computed total records - use input for lazy loading or data length for client-side
  totalRecords = computed(() => {
    if (this.config().pagination.lazy) {
      return this.totalRecordsInput();
    }
    return this.data().length;
  });
  
  // Filter and sort state
  columnFilters = signal<FilterState>({});
  sortState = signal<SortState>({ field: '', order: 'asc' });
  
  // Debounce for global filter
  private globalFilterTimeout: any;
  
  // Pagination state
  currentPage = signal<number>(1);
  rowsPerPage = signal<number>(10);

  constructor() {
    // Reset to page 1 when filters change (better UX)
    effect(() => {
      const filters = this.columnFilters();
      const globalFilter = this.globalFilterValue();
      
      // Only reset if we're not on page 1 and filters have changed
      if (this.currentPage() > 1) {
        this.currentPage.set(1);
      }
    }, { allowSignalWrites: true });

    // Initialize hierarchy when data changes
    effect(() => {
      const data = this.data();
      
      if (this.isHierarchyEnabled() && data.length > 0) {
        this.initializeHierarchy();
      }
    }, { allowSignalWrites: true });
  }

  // Computed properties
  visibleColumns = computed(() => {
    const allColumns = this.config().columns;
    const isHierarchy = this.isHierarchyEnabled();
    return allColumns.filter(col => 
      col.type !== 'actions' && 
      // Exclude 'expand' column when hierarchy is enabled (handled separately)
      !(isHierarchy && col.field === 'expand')
    );
  });
  
  hasSelectedItems = computed(() => 
    this.selectedItems().length > 0
  );

  // Check if there are any active filters, sorting, or non-default pagination
  hasActiveFilters = computed(() => {
    const hasColumnFilters = Object.keys(this.columnFilters()).length > 0;
    const hasGlobalFilter = this.globalFilterValue().trim().length > 0;
    const hasSorting = this.sortState().field !== '';
    const hasNonDefaultPage = this.currentPage() !== 1;
    
    return hasColumnFilters || hasGlobalFilter || hasSorting || hasNonDefaultPage;
  });

  // Update total records to reflect filtered data (for lazy loading) or totalRecords (for client-side)
  filteredTotalRecords = computed(() => {
    // For lazy loading, use the totalRecords from server
    if (this.config().pagination.lazy) {
      return this.totalRecords();
    }
    // For client-side pagination, use filtered data length
    return this.filteredData().length;
  });

  // Debug computed property to check pagination config
  paginationDebug = computed(() => {
    const config = this.config().pagination;
    const total = this.filteredTotalRecords();
    return { enabled: config.enabled, total };
  });

  // Filtered and sorted data
  filteredData = computed(() => {
    // For lazy loading, return data as-is (server handles filtering/sorting)
    if (this.config().pagination.lazy) {
      return this.data();
    }
    
    // Client-side filtering and sorting
    let filtered = [...this.data()];
    
    // Apply global filter
    const globalFilter = this.globalFilterValue().toLowerCase();
    if (globalFilter) {
      filtered = filtered.filter(item => {
        // Use globalFilterFields if specified in config, otherwise use visible columns
        const fieldsToSearch = this.config().globalFilterFields || 
                               this.visibleColumns().map(col => col.field);
        
        return fieldsToSearch.some(field => {
          const value = (item as any)[field];
          return value?.toString().toLowerCase().includes(globalFilter);
        });
      });
    }
    
    // Apply column filters
    const columnFilters = this.columnFilters();
    Object.keys(columnFilters).forEach(field => {
      const filterValue = columnFilters[field];
      if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
        filtered = filtered.filter(item => {
          const itemValue = (item as any)[field];
          
          // Handle different filter types
          const column = this.visibleColumns().find(col => col.field === field);
          
          // Handle range filters (for any field with filterType: 'range')
          if (column?.filterType === 'range' && Array.isArray(filterValue)) {
            const numValue = Number(itemValue);
            return numValue >= filterValue[0] && numValue <= filterValue[1];
          } else if (column?.filterType === 'number') {
            return itemValue === Number(filterValue);
          } else if (column?.type === 'boolean') {
            return itemValue === filterValue;
          } else if (column?.type === 'enum') {
            // For enum/multiselect, filterValue might be an array
            if (Array.isArray(filterValue)) {
              return filterValue.includes(itemValue);
            }
            return itemValue === filterValue;
          } else {
            // Text filter - case insensitive contains
            return itemValue?.toString().toLowerCase().includes(filterValue.toString().toLowerCase());
          }
        });
      }
    });
    
    // Apply sorting
    const sort = this.sortState();
    if (sort.field) {
      filtered.sort((a, b) => {
        const aValue = (a as any)[sort.field];
        const bValue = (b as any)[sort.field];
        
        if (aValue === bValue) return 0;
        
        const comparison = aValue < bValue ? -1 : 1;
        return sort.order === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  });

  // Computed property for paginated data (handles both flat and hierarchical)
  paginatedData = computed(() => {
    // For hierarchical data, use flattened hierarchy
    if (this.isHierarchyEnabled()) {
      const flattenedData = this.flattenedHierarchyData();
      
      // For lazy loading, return data as-is (server handles pagination)
      if (this.config().pagination.lazy) {
        return flattenedData;
      }
      
      // For client-side pagination, slice the data
      const start = (this.currentPage() - 1) * this.rowsPerPage();
      const end = start + this.rowsPerPage();
      return flattenedData.slice(start, end);
    }
    
    // For flat data, use regular pagination
    // For lazy loading, return filtered data as-is (server handles pagination)
    if (this.config().pagination.lazy) {
      return this.filteredData().map(item => ({ 
        data: item, 
        level: 0, 
        expanded: false, 
        loading: false, 
        hasChildren: false 
      } as HierarchicalItem<T>));
    }
    
    // For client-side pagination, slice the data
    const data = this.filteredData();
    const start = (this.currentPage() - 1) * this.rowsPerPage();
    const end = start + this.rowsPerPage();
    return data.slice(start, end).map(item => ({ 
      data: item, 
      level: 0, 
      expanded: false, 
      loading: false, 
      hasChildren: false 
    } as HierarchicalItem<T>));
  });

  // Computed property for grid template columns
  gridTemplateColumns = computed(() => {
    const selectWidth = this.config().actions.canBulkDelete ? '3.75rem ' : '';
    const actionsWidth = '7.5rem ';
    
    // Add hierarchy/expansion column width if hierarchy is enabled
    const hierarchyWidth = this.isHierarchyEnabled() ? '3.75rem ' : '';
    
    // Use column.width directly for all columns (excluding expand column)
    const columnWidths: string[] = [];
    this.visibleColumns().forEach(column => {
      // Skip the 'expand' column as it's handled by hierarchy column
      if (column.field !== 'expand') {
        columnWidths.push(column.width || 'auto');
      }
    });
    
    const dataColumns = columnWidths.join(' ');
    return hierarchyWidth + selectWidth + actionsWidth + dataColumns;
  });
  
  // Computed property for child level grid template columns
  childGridTemplateColumns = computed(() => {
    const selectWidth = this.config().actions.canBulkDelete ? '3.75rem ' : '';
    const actionsWidth = '7.5rem ';
    
    // Add hierarchy/expansion column width if hierarchy is enabled
    const hierarchyWidth = this.isHierarchyEnabled() ? '3.75rem ' : '';
    
    // Add hierarchy indentation spacers for child level (level 1 = 1 spacer of 2rem)
    const hierarchyIndentWidth = '2rem '; // One spacer for level 1
    
    // Use child level column widths
    const childColumns = this.getColumnsForLevel(1);
    const columnWidths: string[] = [];
    childColumns.forEach(column => {
      columnWidths.push(column.width || 'auto');
    });
    
    const dataColumns = columnWidths.join(' ');
    return hierarchyIndentWidth + hierarchyWidth + selectWidth + actionsWidth + dataColumns;
  });

  // Table reference for advanced operations
  @ViewChild('tableContainer') tableContainer!: TemplateRef<any>;

  ngOnInit(): void {
    // Initialize pagination from config
    const paginationConfig = this.config().pagination;
    if (paginationConfig.enabled) {
      this.rowsPerPage.set(paginationConfig.rowsPerPage);
    }
    
    // Trigger initial data load for lazy loading
    if (paginationConfig?.lazy) {
      this.triggerDataLoad();
    }
  }

  // ============= FILTER METHODS =============
  
  getFilterButtonConfig(column: ColumnConfig): FilterButtonConfig {
    const currentValue = this.columnFilters()[column.field];
    
    // Use the filterType specified in the column configuration
    const filterType = column.filterType || 'text';
    
    // For range filters, get min/max/step from column config or calculate dynamically
    if (filterType === 'range') {
      const { min, max, step } = this.getCalculatedRangeValues(column);
      
      return {
        field: column.field,
        header: column.header,
        filterType: 'range',
        currentValue: currentValue || [min, max],
        min,
        max,
        step,
        displayFormat: column.displayFormat
      };
    }
    
    // For other filter types, use standard configuration
    return {
      field: column.field,
      header: column.header,
      filterType: filterType as FilterButtonConfig['filterType'],
      options: column.options,
      currentValue: currentValue,
      displayFormat: column.displayFormat
    };
  }

  /**
   * Calculate min/max values for range filters based on actual data
   */
  private getCalculatedRangeValues(column: ColumnConfig): { min: number; max: number; step: number } {
    const data = this.data();
    
    // Default fallbacks if no data is available
    let min = column.filterMin ?? 0;
    let max = column.filterMax ?? 100;
    const step = column.filterStep ?? 1;
    
    // Calculate actual min/max from data if available
    if (data.length > 0) {
      const values = data
        .map(item => Number((item as any)[column.field]))
        .filter(value => !isNaN(value));
      
      if (values.length > 0) {
        const dataMin = Math.min(...values);
        const dataMax = Math.max(...values);
        
        // If no filterMin/filterMax configured, use data-driven values
        if (column.filterMin === undefined) {
          min = Math.max(0, Math.floor(dataMin)); // Never go below 0, round down
        }
        
        if (column.filterMax === undefined) {
          // Round up max to a nice number for better UX
          if (column.displayFormat === 'currency') {
            max = Math.ceil(dataMax / 10) * 10; // Round up to nearest 10
          } else if (column.field === 'quantity') {
            max = Math.ceil(dataMax / 5) * 5; // Round up to nearest 5
          } else if (column.displayFormat === 'rating') {
            max = 5; // Ratings are always 0-5
          } else {
            max = Math.ceil(dataMax);
          }
        }
        
        // If filterMin/filterMax are configured, respect them but expand if data exceeds
        if (column.filterMin !== undefined) {
          min = Math.min(column.filterMin, dataMin);
        }
        if (column.filterMax !== undefined) {
          max = Math.max(column.filterMax, dataMax);
        }
      }
    }
    
    return { min, max, step };
  }

  onFilterApply(field: string, value: any): void {
    this.onColumnFilter(field, value);
  }

  onFilterClear(field: string): void {
    this.onColumnFilter(field, '');
  }

  onColumnFilter(field: string, value: any): void {
    const currentFilters = this.columnFilters();
    const newFilters = { ...currentFilters };
    
    if (value === '' || value === null || value === undefined) {
      delete newFilters[field];
    } else {
      newFilters[field] = value;
    }
    
    this.columnFilters.set(newFilters);
    // Reset to first page when filtering
    this.currentPage.set(1);
    
    // If lazy loading is enabled, trigger data load
    if (this.config().pagination.lazy) {
      this.triggerDataLoad();
    }
  }

  onGlobalFilter(event: any): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilterValue.set(value);
    // Reset to first page when filtering
    this.currentPage.set(1);
    
    // If lazy loading is enabled, use debounced trigger
    if (this.config().pagination.lazy) {
      this.debounceGlobalFilter();
    }
  }

  private debounceGlobalFilter(): void {
    if (this.globalFilterTimeout) {
      clearTimeout(this.globalFilterTimeout);
    }
    
    this.globalFilterTimeout = setTimeout(() => {
      this.triggerDataLoad();
    }, 500); // 500ms debounce
  }

  clearFilters(): void {
    // Clear all filters
    this.columnFilters.set({});
    this.globalFilterValue.set('');
    
    // Clear sorting
    this.sortState.set({ field: '', order: 'asc' });
    
    // Reset pagination to initial state
    this.currentPage.set(1);
    const paginationConfig = this.config().pagination;
    if (paginationConfig.enabled) {
      this.rowsPerPage.set(paginationConfig.rowsPerPage);
    }
    
    // Emit data load event to reset state
    this.dataLoad.emit({
      page: 1,
      size: paginationConfig?.enabled ? paginationConfig.rowsPerPage : 10,
      sorts: [],
      filters: {}
    });
    
    // Clear selections
    this.selectedItems.set([]);
    
    // If lazy loading is enabled, trigger data load
    if (this.config().pagination.lazy) {
      this.triggerDataLoad();
    }
  }

  // ============= SORT METHODS =============
  
  onSort(field: string): void {
    const currentSort = this.sortState();
    const newOrder = currentSort.field === field && currentSort.order === 'asc' ? 'desc' : 'asc';
    
    this.sortState.set({ field, order: newOrder });
    // Reset to first page when sorting
    this.currentPage.set(1);
    
    // If lazy loading is enabled, trigger data load
    if (this.config().pagination.lazy) {
      this.triggerDataLoad();
    }
  }

  getSortIcon(field: string): string {
    const sort = this.sortState();
    if (sort.field !== field) return 'pi pi-sort';
    return sort.order === 'asc' ? 'pi pi-sort-up' : 'pi pi-sort-down';
  }

  // ============= PAGINATION METHODS =============
  
  onPageChange(event: any): void {
    // Update the rows per page first
    this.rowsPerPage.set(event.rows);
    
    // Calculate the new current page (PrimeNG uses 0-based pages, we use 1-based)
    const newPage = event.page + 1;
    
    // For client-side pagination, ensure we don't go beyond available pages
    if (!this.config().pagination.lazy) {
      const totalRecords = this.filteredTotalRecords();
      const maxPages = Math.ceil(totalRecords / event.rows);
      const validPage = Math.min(newPage, Math.max(1, maxPages));
      this.currentPage.set(validPage);
    } else {
      this.currentPage.set(newPage);
    }
    
    // If lazy loading is enabled, trigger data load
    if (this.config().pagination.lazy) {
      this.triggerDataLoad();
    }
    // For client-side pagination, no need to trigger data load - computed properties will update automatically
  }

  // ============= UTILITY METHODS =============
  
  getColumnValue(item: any, column: { field: string }): any {
    // Handle calculated fields for cart total value
    if (column.field === 'cartTotalValue') {
      if (item && item.cart && Array.isArray(item.cart)) {
        return item.cart.reduce((total: number, cartItem: any) => 
          total + (cartItem.quantity * cartItem.productPrice), 0);
      }
      return 0;
    }
    
    // Handle calculated fields for cart item subtotal
    if (column.field === 'subtotal') {
      if (item && item.quantity && item.productPrice) {
        return item.quantity * item.productPrice;
      }
      return 0;
    }
    
    return item[column.field];
  }

  triggerDataLoad(): void {
    const sortConfig = this.sortState();
    const sorts = sortConfig.field ? [{ field: sortConfig.field, direction: sortConfig.order }] : [];
    
    // Combine column filters with global search
    const filters = { ...this.columnFilters() };
    const globalSearch = this.globalFilterValue().trim();
    if (globalSearch) {
      filters.search = globalSearch;
    }
    
    this.dataLoad.emit({
      page: this.currentPage(),
      size: this.rowsPerPage(),
      sorts,
      filters
    });
  }

  // ============= CRUD METHODS (STUBS) =============
  
  addNewItem(): void {
    this.isCreatingNew.set(true);
    this.newItem.set({});
  }

  cancelNewItem(): void {
    this.isCreatingNew.set(false);
    this.newItem.set({});
  }

  async saveNewItem(newItemData: Partial<T>): Promise<void> {
    try {
      if (this.config().createItem) {
        await this.config().createItem!(newItemData as any);
      } else {
        // No createItem function configured
      }
      // Close the new item form on success
      this.isCreatingNew.set(false);
      this.newItem.set({});
    } catch (error) {
      // Error handling is done in the parent component
      throw error; // Re-throw so parent can handle it
    }
  }

  startEdit(item: T): void {
    this.editingItem.set(item);
    this.editItemData.set({ ...item });
  }

  cancelEdit(): void {
    this.editingItem.set(null);
    this.editItemData.set({});
  }

  async saveEdit(editedData: Partial<T>): Promise<void> {
    try {
      // Check if this is a cart item update (has productId and userId)
      const isCartItem = (editedData as any).productId && ((editedData as any).userId || (editedData as any).parentUserId);
      
      if (isCartItem) {
        // Handle cart item quantity update
        await this.handleCartItemUpdate(editedData as any);
      } else if (this.config().updateItem) {
        // Handle regular item update
        const itemId = (editedData as any)[this.config().dataKey];
        await this.config().updateItem!(itemId, editedData as any);
      }
      
      // Close the edit form on success
      this.editingItem.set(null);
      this.editItemData.set({});
      
      // Refresh data to show updated values - expansion state will be preserved
      this.triggerDataLoad();
    } catch (error) {
      // Error handling is done in the parent component
      throw error; // Re-throw to maintain error propagation
    }
  }

  /**
   * Handle cart item quantity update
   */
  private async handleCartItemUpdate(cartItem: any): Promise<void> {
    // For cart items (level 1), use parentUserId as the actual user ID
    // cartItem.userId contains composite ID like "2_1", parentUserId contains actual user ID
    const userId = cartItem.parentUserId || cartItem.userId;
    const productId = cartItem.productId;
    const quantity = cartItem.quantity;
    
    if (!userId || !productId || !quantity) {
      throw new Error('Missing required cart item information');
    }

    const success = await this.adminCart.updateCartItemQuantity(userId, productId, quantity);
    if (!success) {
      const storeError = this.adminCart.error();
      throw new Error(`Failed to update cart item quantity${storeError ? ': ' + storeError : ''}`);
    }
  }

  async deleteItem(item: T): Promise<void> {
    const itemId = (item as any)[this.config().dataKey];
    const itemName = (item as any).name || `${this.config().objectName} #${itemId}`;
    
    // Check if this is a cart item (has productId and parentUserId)
    const isCartItem = (item as any).productId && (item as any).parentUserId;
    
    let confirmationMessage: string;
    if (isCartItem) {
      // Custom message for cart items: "Are you sure you want to delete <productName> for user <userID>?"
      const productName = (item as any).productName || 'Unknown Product';
      const userId = (item as any).parentUserId;
      confirmationMessage = `Are you sure you want to delete "${productName}" for user ${userId}?`;
    } else {
      // Default message for other items
      confirmationMessage = `Are you sure you want to delete "${itemName}"?`;
    }
    
    this.confirmationService.confirm({
      message: confirmationMessage,
      header: `Delete ${this.config().objectName}`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: async () => {
        try {
          const deleteFunction = this.config().deleteItem;
          if (deleteFunction) {
            await deleteFunction(itemId);
            
            // Only show success message for cart items since regular items 
            // (products, users) show messages through their config methods
            if (isCartItem) {
              const productName = (item as any).productName || 'Unknown Product';
              const userId = (item as any).parentUserId;
              const successMessage = `"${productName}" has been removed from user ${userId}'s cart successfully.`;
              
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: successMessage
              });
            }

            // Remove the item from selected items if it was selected
            const currentSelected = this.selectedItems();
            if (currentSelected.includes(item)) {
              this.selectedItems.set(currentSelected.filter(i => i !== item));
            }

            // Trigger data reload to refresh the list
            this.triggerDataLoad();
          }
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error instanceof Error ? error.message : `Failed to delete ${this.config().objectName.toLowerCase()}.`
          });
        }
      }
    });
  }

  toggleSelectItem(item: T): void {
    const selected = this.selectedItems();
    const isSelected = selected.includes(item);
    
    if (isSelected) {
      this.selectedItems.set(selected.filter(i => i !== item));
    } else {
      this.selectedItems.set([...selected, item]);
    }
  }

  /**
   * Handle custom actions triggered from row components
   */
  async handleCustomAction(event: { action: string; item: T; actionData?: any }): Promise<void> {
    const { action, item, actionData } = event;
    const config = this.config();
    
    // Check if this action requires confirmation
    if (actionData?.confirm) {
      const confirmMessage = actionData.confirmMessage || 'Are you sure you want to proceed?';
      
      this.confirmationService.confirm({
        message: confirmMessage,
        accept: async () => {
          await this.executeCustomActionLogic(action, item, config);
        }
      });
    } else {
      await this.executeCustomActionLogic(action, item, config);
    }
  }

  private async executeCustomActionLogic(action: string, item: T, config: any): Promise<void> {
    // Handle admin cart-specific actions
    if (action === 'remove-item') {
      await this.handleRemoveCartItem(item);
    } else if (action === 'edit-quantity') {
      // For edit-quantity, we don't need to do anything special here since 
      // the quantity controls component handles the quantity change directly
    } else if (action === 'clear-cart') {
      // Use config's executeCustomAction instead of direct hooks call
      if (config.executeCustomAction && (item as any).id) {
        await config.executeCustomAction(action, (item as any).id);
      } else {
        // Fallback to old method if config doesn't have executeCustomAction
        await this.handleClearCart(item);
      }
    } else if (action === 'add-product') {
      // Determine the correct child action based on the configuration
      const hierarchyConfig = this.hierarchyConfig();
      let childActionName = 'ADD_CART_ITEM'; // Default fallback
      
      if (hierarchyConfig?.childAttributeField === 'cart') {
        childActionName = 'ADD_CART_ITEM';
      } else if (hierarchyConfig?.childAttributeField === 'wishlist') {
        childActionName = 'ADD_WISHLIST_ITEM';
      }
      
      await this.executeChildAction(childActionName, item);
    } else {
      // Unknown custom action
    }
  }

  /**
   * Handle removing a cart item
   */
  private async handleRemoveCartItem(item: any): Promise<void> {
    // For cart items (level 1), use parentUserId as the actual user ID
    const userId = item.parentUserId || item.userId;
    const productId = item.productId;
    
    if (!userId || !productId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to remove item: missing user or product information'
      });
      return;
    }

    // Show confirmation dialog
    this.confirmationService.confirm({
      message: `Are you sure you want to remove "${item.productName}" from the cart?`,
      header: 'Confirm Removal',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        const success = await this.adminCart.removeCartItem(userId, productId);
        if (success) {
          // Refresh data to show updated cart
          this.triggerDataLoad();
        }
      }
    });
  }

  /**
   * Handle clearing entire cart for a user
   */
  private async handleClearCart(item: any): Promise<void> {
    const userId = item.userId;
    
    if (!userId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to clear cart: missing user information'
      });
      return;
    }

    // Show confirmation dialog
    this.confirmationService.confirm({
      message: `Are you sure you want to clear all items from ${item.userName || item.firstname || 'this user'}'s cart? This action cannot be undone.`,
      header: 'Clear Cart',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        const success = await this.adminCart.clearUserCart(userId);
        if (success) {
          // Refresh data to show updated cart
          this.triggerDataLoad();
        }
      }
    });
  }

  /**
   * Generic method to handle child actions (replaces handleAddProductToCart)
   */
  private async executeChildAction(actionType: string, parentItem: any): Promise<void> {
    const config = this.config();
    const actionConfig = config.childActions?.[actionType];
    
    if (!actionConfig) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Child action '${actionType}' is not configured`
      });
      return;
    }

    const parentId = parentItem[actionConfig.parentIdField];
    
    if (!parentId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Unable to execute action: missing ${actionConfig.parentIdField}`
      });
      return;
    }

    // Set generic child action state
    this.currentChildAction.set({
      type: actionType,
      parentId: parentId,
      data: { ...actionConfig.childTemplate }
    });
    
    // Reset the new child data
    this.newChildData.set({ ...actionConfig.childTemplate });

    // Expand the parent section to show the add row
    // Find the hierarchical item for this parent and expand it
    const hierarchicalData = this.hierarchicalData();
    const parentHierarchicalItem = hierarchicalData.find(hierarchicalItem => 
      hierarchicalItem.level === 0 && (hierarchicalItem.data as any)[actionConfig.parentIdField] === parentId
    );
    
    if (parentHierarchicalItem) {
      const itemId = (parentHierarchicalItem.data as any)[this.config().dataKey];
      const expandedSet = new Set(this.expandedItems());
      expandedSet.add(itemId);
      this.expandedItems.set(expandedSet);
      
      // Also set the expanded flag on the hierarchical item
      parentHierarchicalItem.expanded = true;
    } else {
      // If hierarchical item not found yet, at least set the expanded state
      // This will be preserved when hierarchy is rebuilt
      const itemId = parentId; // Assuming parentId is the dataKey for parent items
      const expandedSet = new Set(this.expandedItems());
      expandedSet.add(itemId);
      this.expandedItems.set(expandedSet);
    }
    
    // Force a small delay to ensure the UI updates properly
    setTimeout(() => {
      // Re-initialize hierarchy to ensure proper state after adding cart item
      if (this.isHierarchyEnabled()) {
        this.initializeHierarchy();
      }
    }, 0);
  }

  /**
   * Cancel current child action (replaces cancelAddCartItem)
   */
  cancelChildAction(): void {
    const action = this.currentChildAction();
    if (!action) return;
    
    const config = this.config();
    const actionConfig = config.childActions?.[action.type];
    
    if (!actionConfig) return;

    // Reset action state
    this.currentChildAction.set(null);
    this.newChildData.set({});

    // Check if parent should be collapsed based on config
    const hierarchicalData = this.hierarchicalData();
    const parentHierarchicalItem = hierarchicalData.find(hierarchicalItem => 
      hierarchicalItem.level === 0 && (hierarchicalItem.data as any)[actionConfig.parentIdField] === action.parentId
    );
    
    if (parentHierarchicalItem && actionConfig.shouldCollapseOnCancel(parentHierarchicalItem.data)) {
      // Parent should be collapsed
      const itemId = (parentHierarchicalItem.data as any)[this.config().dataKey];
      const expandedSet = new Set(this.expandedItems());
      expandedSet.delete(itemId);
      this.expandedItems.set(expandedSet);
      
      // Also set the expanded flag on the hierarchical item
      parentHierarchicalItem.expanded = false;
    }
  }

  /**
   * Helper method to check if we're executing a child action for a specific parent (replaces isAddingCartItemForUser)
   */
  isExecutingChildActionForParent(parentData: any, actionType?: string): boolean {
    const action = this.currentChildAction();
    if (!action) return false;
    
    const config = this.config();
    const actionConfig = config.childActions?.[action.type];
    if (!actionConfig) return false;
    
    // Check if action type matches (if specified)
    if (actionType && action.type !== actionType) return false;
    
    // Check if this is the correct parent
    const parentId = parentData[actionConfig.parentIdField];
    return action.parentId === parentId;
  }

  /**
   * Save new child data for the active action (replaces saveNewCartItem)
   */
  async saveNewChildData(childData?: any): Promise<void> {
    const action = this.currentChildAction();
    if (!action) return;

    const config = this.config();
    const actionConfig = config.childActions?.[action.type];
    if (!actionConfig) return;

    // Use childData from row-tab component if provided, otherwise fallback to newChildData signal
    const dataToUse = childData || this.newChildData();
    
    // Check if we have the necessary data (either selectedProduct or productId)
    const hasProduct = dataToUse.selectedProduct || dataToUse.productId;
    const productId = dataToUse.selectedProduct?.id || dataToUse.productId;
    const quantity = dataToUse.quantity || 1;

    if (!action.parentId || !hasProduct || !productId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please select a product to add to cart'
      });
      return;
    }

    try {
      // Call the save handler if it exists
      if (actionConfig.saveHandler) {
        const success = await actionConfig.saveHandler(action.parentId, {
          productId: productId,
          quantity: quantity
        });

        if (success) {
          // Store the parentId before resetting state
          const parentIdToKeepExpanded = action.parentId;
          
          // Reset the action state
          this.currentChildAction.set(null);
          this.newChildData.set({
            productId: null,
            selectedProduct: null,
            quantity: 1
          });

          // Trigger a data reload to refresh the display
          this.dataLoad.emit({ 
            page: this.currentPage(), 
            size: this.rowsPerPage(), 
            sorts: [], 
            filters: this.columnFilters() 
          });

          // After data reload, ensure the parent section stays expanded if configured
          if (actionConfig.shouldKeepExpandedOnSave) {
            setTimeout(() => {
              const hierarchicalData = this.hierarchicalData();
              const parentHierarchicalItem = hierarchicalData.find(hierarchicalItem => 
                hierarchicalItem.level === 0 && (hierarchicalItem.data as any)[actionConfig.parentIdField] === parentIdToKeepExpanded
              );
              
              if (parentHierarchicalItem) {
                const itemId = (parentHierarchicalItem.data as any)[this.config().dataKey];
                const expandedSet = new Set(this.expandedItems());
                expandedSet.add(itemId);
                this.expandedItems.set(expandedSet);
                
                // Also set the expanded flag on the hierarchical item
                parentHierarchicalItem.expanded = true;
              }
            }, 100); // Small delay to allow data reload to complete
          }
        }
      }

    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to save data'
      });
      throw error;
    }
  }

  /**
   * Create child data object for display in the row-tab component (replaces newCartItemForDisplay)
   */
  newChildDataForDisplay(): any {
    const childData = this.newChildData();
    const action = this.currentChildAction();
    
    if (!action) return {};
    
    const config = this.config();
    const calculatedFields = config.calculatedFields || {};
    
    // Start with base child data
    const displayData = {
      productId: childData.productId || null,
      productName: childData.selectedProduct?.name || '',
      quantity: childData.quantity,
      productPrice: childData.selectedProduct?.price || 0,
      productStockQuantity: childData.selectedProduct?.quantity || 0,
      // Additional properties for the row-tab component
      _isNewChild: true,
      _selectedProduct: childData.selectedProduct,
      ...childData
    };
    
    // Apply calculated fields from config
    Object.keys(calculatedFields).forEach(fieldName => {
      const calculator = calculatedFields[fieldName];
      if (typeof calculator === 'function') {
        displayData[fieldName] = calculator(displayData);
      }
    });
    
    return displayData;
  }

  /**
   * Helper method to identify if an item is a user row (level 0)
   */
  private isUserRow(item: any): boolean {
    return (item.level === 0 || item.itemType === 'user') && item.userId !== undefined;
  }

  /**
   * Helper method to check if user has existing cart items
   */
  private hasExistingCartItems(userData: any): boolean {
    const config = this.hierarchyConfig();
    if (config?.childAttributeField) {
      const childArray = userData[config.childAttributeField];
      return Array.isArray(childArray) && childArray.length > 0;
    }
    
    // For flattened data, check if there are child items
    const hierarchicalData = this.hierarchicalData();
    const userHierarchicalItem = hierarchicalData.find(item => 
      item.level === 0 && (item.data as any).userId === userData.userId
    );
    
    return userHierarchicalItem && userHierarchicalItem.children ? userHierarchicalItem.children.length > 0 : false;
  }

  isEditing(item: T): boolean {
    return this.editingItem() === item;
  }

  isItemSelected(item: T): boolean {
    return this.selectedItems().includes(item);
  }

  isAllSelected(): boolean {
    const items = this.filteredData();
    const selected = this.selectedItems();
    return items.length > 0 && selected.length === items.length;
  }

  toggleSelectAll(): void {
    const allSelected = this.isAllSelected();
    if (allSelected) {
      this.selectedItems.set([]);
    } else {
      this.selectedItems.set([...this.filteredData()]);
    }
  }

  async deleteSelectedItems(): Promise<void> {
    const selectedItems = this.selectedItems();
    const selectedCount = selectedItems.length;
    
    if (selectedCount === 0) return;

    const itemsText = selectedCount === 1 ? 
      `1 ${this.config().objectName.toLowerCase()}` : 
      `${selectedCount} ${this.config().objectName.toLowerCase()}s`;

    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${itemsText}? This action cannot be undone.`,
      header: `Delete ${itemsText}`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: async () => {
        try {
          const bulkDeleteFunction = this.config().bulkDelete;
          if (bulkDeleteFunction) {
            // Extract IDs from selected items
            const selectedIds = selectedItems.map(item => (item as any)[this.config().dataKey]);
            
            await bulkDeleteFunction(selectedIds);
            
            // Clear selection
            this.selectedItems.set([]);

            // Trigger data reload to refresh the list
            this.triggerDataLoad();
          }
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error instanceof Error ? error.message : `Failed to delete selected ${this.config().objectName.toLowerCase()}s.`
          });
        }
      }
    });
  }

  exportData(): void {
    // Implementation needed by parent component
  }

  // ============= GLOBAL SEARCH METHODS =============
  
  onGlobalSearchChange(value: string): void {
    this.globalFilterValue.set(value);
    // Reset to first page when filtering
    this.currentPage.set(1);
    
    // If lazy loading is enabled, trigger data load
    if (this.config().pagination.lazy) {
      this.triggerDataLoad();
    }
  }

  onGlobalSearchClear(): void {
    this.globalFilterValue.set('');
    // Reset to first page when clearing search
    this.currentPage.set(1);
    
    // If lazy loading is enabled, trigger data load
    if (this.config().pagination.lazy) {
      this.triggerDataLoad();
    }
  }

  clearFiltersTooltip = computed(() => {
    const hasFilters = this.hasActiveFilters();
    return hasFilters ? 'Clear all filters and reset table' : 'No active filters to clear';
  });

  // ============= HIERARCHICAL DATA METHODS =============
  
  /**
   * Transform flat data into hierarchical structure
   */
  private buildHierarchy(flatData: T[], parentId: any = null, level: number = 0): HierarchicalItem<T>[] {
    const config = this.hierarchyConfig();
    const configInfo = this.config();
    if (!config) return flatData.map(item => ({ data: item, level: 0 }));
    
    const hierarchicalItems: HierarchicalItem<T>[] = [];
    const expandedItems = this.expandedItems(); // Get current expanded state
    
    // Handle attribute-based hierarchy (nested arrays)
    if (config.childAttributeField && level === 0) {
      // For root level with attribute-based hierarchy, process each item
      for (const item of flatData) {
        const itemId = (item as any)[this.config().dataKey];
        const isExpanded = expandedItems.has(itemId); // Preserve expansion state
        
        const hierarchicalItem: HierarchicalItem<T> = {
          data: item,
          level: 0,
          parentId: null,
          children: [],
          expanded: isExpanded, // Use preserved state
          loading: false,
          hasChildren: this.hasChildItems(item, flatData, config.parentIdField) // This now always returns true for users
        };
        
        // Build children from the child attribute array OR create empty structure for expansion
        const childArray = (item as any)[config.childAttributeField];
        
        if (config.loadStrategy === 'eager') {
          if (Array.isArray(childArray) && childArray.length > 0) {
            // User has existing cart items
            hierarchicalItem.children = childArray.map((childItem, index) => {
              const childId = `${itemId}_${childItem.productId || index}`;
              const isChildExpanded = expandedItems.has(childId); // Preserve child expansion state
              
              const childHierarchicalItem = {
                data: {
                  ...childItem,
                  // Add unique ID for child items
                  [`${this.config().dataKey}`]: childId,
                  // Add parent reference
                  parentUserId: itemId
                },
                level: 1,
                parentId: itemId,
                children: [],
                expanded: isChildExpanded, // Use preserved state
                loading: false,
                hasChildren: false
              } as HierarchicalItem<T>;
              
              return childHierarchicalItem;
            });
          } else {
            // User has no cart items - create empty children array to allow expansion for adding items
            hierarchicalItem.children = [];
          }
        }
        
        hierarchicalItems.push(hierarchicalItem);
      }
      
      return hierarchicalItems;
    }
    
    // Original logic for flattened hierarchy data
    for (const item of flatData) {
      const itemParentId = (item as any)[config.parentIdField];
      
      if (itemParentId === parentId) {
        const itemId = (item as any)[this.config().dataKey];
        const isExpanded = expandedItems.has(itemId); // Preserve expansion state
        const isUserRow = (item as any).level === 0 || (item as any).itemType === 'user';
        
        const hierarchicalItem: HierarchicalItem<T> = {
          data: item,
          level,
          parentId: itemParentId,
          children: [],
          expanded: isExpanded, // Use preserved state
          loading: false,
          hasChildren: this.hasChildItems(item, flatData, config.parentIdField) // Enhanced to always return true for users
        };
        
        // Recursively build children if loading strategy is 'eager'
        if (config.loadStrategy === 'eager') {
          const children = this.buildHierarchy(
            flatData, 
            (item as any)[this.config().dataKey], 
            level + 1
          );
          
          hierarchicalItem.children = children;
          
          // ENHANCEMENT: For user rows with no existing cart items, ensure children array exists for add functionality
          if (isUserRow && children.length === 0) {
            hierarchicalItem.children = []; // Empty but expandable for adding cart items
          }
        }
        
        hierarchicalItems.push(hierarchicalItem);
      }
    }
    
    return hierarchicalItems;
  }
  
  /**
   * Check if item has children
   */
  private hasChildItems(item: T, allData: T[], parentIdField: string): boolean {
    const itemId = (item as any)[this.config().dataKey];
    const config = this.hierarchyConfig();
    
    // NEW: Check if using attribute-based hierarchy (nested arrays)
    if (config?.childAttributeField) {
      const childArray = (item as any)[config.childAttributeField];
      const hasChildren = Array.isArray(childArray) && childArray.length > 0;
      
      // ENHANCEMENT: For user cart management, always allow expansion for users (level 0)
      // This enables adding cart items even for users with empty carts
      if (this.isUserRow(item as any)) {
        return true; // Users can always have cart items added
      }
      
      return hasChildren;
    }
    
    // Original logic for flattened hierarchy data
    const hasExistingChildren = allData.some(otherItem => (otherItem as any)[parentIdField] === itemId);
    
    // ENHANCEMENT: For flattened hierarchy, also allow expansion for user rows
    if (this.isUserRow(item as any)) {
      return true; // Users can always have cart items added
    }
    
    return hasExistingChildren;
  }
  
  /**
   * Get flattened view of hierarchical data for rendering
   */
  flattenedHierarchyData = computed(() => {
    if (!this.isHierarchyEnabled()) {
      return this.data().map(item => ({ 
        data: item, 
        level: 0, 
        expanded: false, 
        loading: false, 
        hasChildren: false 
      } as HierarchicalItem<T>));
    }
    
    return this.flattenHierarchy(this.hierarchicalData());
  });
  
  /**
   * Flatten hierarchical data for table rendering
   * Only includes top-level items (level 0) since children are handled in template
   */
  private flattenHierarchy(items: HierarchicalItem<T>[]): HierarchicalItem<T>[] {
    const flattened: HierarchicalItem<T>[] = [];
    
    for (const item of items) {
      // Only include top-level items (level 0)
      // Children are handled separately in the template's children section
      if (item.level === 0) {
        flattened.push(item);
      }
    }
    
    return flattened;
  }
  
  /**
   * Toggle expansion of hierarchical item
   */
  async toggleExpansion(item: HierarchicalItem<T>): Promise<void> {
    const config = this.hierarchyConfig();
    if (!config) return;
    
    const itemId = (item.data as any)[this.config().dataKey];
    const expanded = this.expandedItems();
    
    if (item.expanded) {
      // Collapse
      item.expanded = false;
      expanded.delete(itemId);
    } else {
      // Expand
      item.expanded = true;
      expanded.add(itemId);
      
      // Load children if not already loaded and using lazy loading
      if (config.loadStrategy === 'lazy' && (!item.children || item.children.length === 0)) {
        await this.loadChildren(item);
      }
    }
    
    this.expandedItems.set(new Set(expanded));
  }
  
  /**
   * Load children for a hierarchical item
   */
  private async loadChildren(item: HierarchicalItem<T>): Promise<void> {
    const config = this.hierarchyConfig();
    if (!config) return;
    
    const itemId = (item.data as any)[this.config().dataKey];
    const loadingSet = this.loadingChildren();
    
    // Set loading state
    item.loading = true;
    loadingSet.add(itemId);
    this.loadingChildren.set(new Set(loadingSet));
    
    try {
      // Load child data
      const childData = await config.childDataLoader(itemId, item.level + 1);
      
      // Convert to hierarchical items
      item.children = childData.map(childItem => ({
        data: childItem,
        level: item.level + 1,
        parentId: itemId,
        children: [],
        expanded: false,
        loading: false,
        hasChildren: this.hasChildItems(childItem, childData, config.parentIdField)
      }));
      
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load child items'
      });
    } finally {
      // Clear loading state
      item.loading = false;
      loadingSet.delete(itemId);
      this.loadingChildren.set(new Set(loadingSet));
    }
  }
  
  /**
   * Get configuration for specific hierarchy level
   */
  getLevelConfig(level: number): LevelConfig<T> | null {
    const config = this.hierarchyConfig();
    if (!config?.levelConfigs) return null;
    
    return config.levelConfigs.find(lc => lc.level === level) || null;
  }
  
  /**
   * Get columns for specific hierarchy level
   */
  getColumnsForLevel(level: number): ColumnConfig[] {
    const levelConfig = this.getLevelConfig(level);
    return levelConfig?.columns || this.config().columns;
  }
  
  /**
   * Get actions for specific hierarchy level
   */
  getActionsForLevel(level: number) {
    const levelConfig = this.getLevelConfig(level);
    return levelConfig?.actions || this.config().actions;
  }
  
  /**
   * Get config for specific hierarchy level with level-specific actions
   */
  getConfigForLevel(level: number) {
    const levelActions = this.getActionsForLevel(level);
    return {
      ...this.config(),
      actions: levelActions
    };
  }
  
  /**
   * Check if item can be expanded
   */
  canExpand(item: HierarchicalItem<T>): boolean {
    const levelConfig = this.getLevelConfig(item.level);
    const allowExpansion = levelConfig?.allowExpansion !== false; // Default to true
    const config = this.hierarchyConfig();
    const withinMaxDepth = !config?.maxDepth || item.level < config.maxDepth;
    
    // For level 0 (users), always show expand icon to maintain layout consistency
    // Even if cart/wishlist is empty, show grey disabled icon
    if (item.level === 0 && (config?.childAttributeField === 'cart' || config?.childAttributeField === 'wishlist')) {
      return allowExpansion && withinMaxDepth;
    }
    
    // For other levels, use original logic
    const hasChildren = item.hasChildren || false;
    return allowExpansion && withinMaxDepth && hasChildren;
  }

  /**
   * Check if a cart/wishlist is empty (for styling purposes)
   */
  isCartEmpty(item: HierarchicalItem<T>): boolean {
    if (item.level !== 0) return false; // Only check for level 0 (users)
    
    const config = this.hierarchyConfig();
    if (config?.childAttributeField === 'cart' || config?.childAttributeField === 'wishlist') {
      const itemArray = (item.data as any)[config.childAttributeField];
      return !Array.isArray(itemArray) || itemArray.length === 0;
    }
    
    return false;
  }
  
  /**
   * Initialize hierarchical data from flat data
   */
  private initializeHierarchy(): void {
    if (!this.isHierarchyEnabled()) {
      return;
    }
    
    const hierarchyData = this.buildHierarchy(this.data());
    this.hierarchicalData.set(hierarchyData);
  }
}