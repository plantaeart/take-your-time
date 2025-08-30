import { Component, OnInit, input, signal, computed, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { TableManagementConfig, ColumnConfig, FilterType } from '../object-management-config/table-config.interface';
import { RowTabComponent } from '../row-tab/row-tab.component';
import { ButtonConfirmPopupComponent, FilterButtonConfig } from '../../ui/button-confirm-popup/button-confirm-popup.component';

interface FilterState {
  [key: string]: any;
}

interface SortState {
  field: string;
  order: 'asc' | 'desc';
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
    RowTabComponent,
    ButtonConfirmPopupComponent
  ],
  templateUrl: './tab-management.component.html',
  styleUrl: './tab-management.component.css'
})
export class TabManagementComponent<T = any> implements OnInit {
  // Inputs
  config = input.required<TableManagementConfig<T>>();
  data = input<T[]>([]);
  loading = input<boolean>(false);

  // Outputs (events for parent to handle)
  dataLoad = signal<{
    page: number;
    size: number;
    sorts: { field: string; direction: 'asc' | 'desc' }[];
    filters: FilterState;
  }>({ page: 1, size: 10, sorts: [], filters: {} });

  // Internal state
  selectedItems = signal<T[]>([]);
  isCreatingNew = signal<boolean>(false);
  newItem = signal<Partial<T>>({});
  editingItem = signal<T | null>(null);
  editItemData = signal<Partial<T>>({});
  globalFilterValue = signal<string>('');
  totalRecords = signal<number>(0);
  
  // Filter and sort state
  columnFilters = signal<FilterState>({});
  sortState = signal<SortState>({ field: '', order: 'asc' });
  
  // Pagination state
  currentPage = signal<number>(1);
  rowsPerPage = signal<number>(10);

  // Computed properties
  visibleColumns = computed(() => 
    this.config().columns.filter(col => col.type !== 'actions')
  );
  
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

  // Update total records to reflect filtered data
  filteredTotalRecords = computed(() => this.filteredData().length);

  // Filtered and sorted data
  filteredData = computed(() => {
    let filtered = [...this.data()];
    
    // Apply global filter
    const globalFilter = this.globalFilterValue().toLowerCase();
    if (globalFilter) {
      filtered = filtered.filter(item => {
        return this.visibleColumns().some(column => {
          const value = (item as any)[column.field];
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
          } else if (column?.type === 'boolean') {
            return itemValue === filterValue;
          } else if (column?.type === 'number') {
            return itemValue === Number(filterValue);
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

  // Computed property for paginated data
  paginatedData = computed(() => {
    const data = this.filteredData();
    const start = (this.currentPage() - 1) * this.rowsPerPage();
    const end = start + this.rowsPerPage();
    return data.slice(start, end);
  });

  // Computed property for grid template columns
  gridTemplateColumns = computed(() => {
    const selectWidth = this.config().actions.canBulkDelete ? '60px ' : '';
    const actionsWidth = '120px ';
    
    // Define specific widths for different column types and special cases
    const columnWidths: string[] = [];
    this.visibleColumns().forEach(column => {
      // Handle special cases first
      if (column.field === 'description') {
        // Description fields need more space regardless of type
        columnWidths.push('max(320px, 25vw)');
      } else if (column.displayFormat === 'currency') {
        // Currency fields (like price) need moderate width
        columnWidths.push('max(160px, 8vw)');
      } else if (column.displayFormat === 'rating') {
        // Rating fields should match other number columns
        columnWidths.push('max(160px, 7vw)');
      } else {
        // Standard type-based widths
        switch (column.type) {
          case 'number':
            columnWidths.push('max(160px, 7vw)');
            break;
          case 'text':
            columnWidths.push('max(180px, 12vw)');
            break;
          case 'image':
            columnWidths.push('max(120px, 8vw)');
            break;
          case 'enum':
            columnWidths.push('max(160px, 9vw)');
            break;
          case 'date':
            columnWidths.push('max(120px, 8vw)');
            break;
          case 'boolean':
            columnWidths.push('max(90px, 6vw)');
            break;
          case 'actions':
            columnWidths.push('max(120px, 8vw)');
            break;
          default:
            columnWidths.push('max(160px, 10vw)'); // Default width for other columns
        }
      }
    });
    
    const dataColumns = columnWidths.join(' ');
    return selectWidth + actionsWidth + dataColumns;
  });

  // Table reference for advanced operations
  @ViewChild('tableContainer') tableContainer!: TemplateRef<any>;

  ngOnInit(): void {
    // Initialize pagination from config
    const paginationConfig = this.config().pagination;
    if (paginationConfig.enabled) {
      this.rowsPerPage.set(paginationConfig.rowsPerPage);
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
  }

  onGlobalFilter(event: any): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilterValue.set(value);
    // Reset to first page when filtering
    this.currentPage.set(1);
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
    
    // Reset data load signal to initial state
    this.dataLoad.set({
      page: 1,
      size: paginationConfig?.enabled ? paginationConfig.rowsPerPage : 10,
      sorts: [],
      filters: {}
    });
    
    // Clear selections
    this.selectedItems.set([]);
  }

  // ============= SORT METHODS =============
  
  onSort(field: string): void {
    const currentSort = this.sortState();
    const newOrder = currentSort.field === field && currentSort.order === 'asc' ? 'desc' : 'asc';
    
    this.sortState.set({ field, order: newOrder });
    // Reset to first page when sorting
    this.currentPage.set(1);
  }

  getSortIcon(field: string): string {
    const sort = this.sortState();
    if (sort.field !== field) return 'pi pi-sort';
    return sort.order === 'asc' ? 'pi pi-sort-up' : 'pi pi-sort-down';
  }

  // ============= PAGINATION METHODS =============
  
  onPageChange(event: any): void {
    this.currentPage.set(event.page + 1); // PrimeNG uses 0-based pages
    this.rowsPerPage.set(event.rows);
    // No need to trigger data load for local pagination
  }

  // ============= UTILITY METHODS =============
  
  getColumnValue(item: any, column: { field: string }): any {
    return item[column.field];
  }

  triggerDataLoad(): void {
    const sortConfig = this.sortState();
    const sorts = sortConfig.field ? [{ field: sortConfig.field, direction: sortConfig.order }] : [];
    
    this.dataLoad.set({
      page: this.currentPage(),
      size: this.rowsPerPage(),
      sorts,
      filters: this.columnFilters()
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

  saveNewItem(): void {
    console.log('Save new item:', this.newItem());
    // Implementation needed by parent component
  }

  startEdit(item: T): void {
    this.editingItem.set(item);
    this.editItemData.set({ ...item });
  }

  cancelEdit(): void {
    this.editingItem.set(null);
    this.editItemData.set({});
  }

  saveEdit(): void {
    console.log('Save edit:', this.editItemData());
    // Implementation needed by parent component
  }

  deleteItem(item: T): void {
    console.log('Delete item:', item);
    // Implementation needed by parent component
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

  deleteSelectedItems(): void {
    const selectedCount = this.selectedItems().length;
    if (selectedCount === 0) return;

    console.log('Bulk delete requested for:', this.selectedItems());
    // Implementation needed by parent component
    
    // For now, just clear selection
    this.selectedItems.set([]);
  }

  exportData(): void {
    console.log('Export data requested');
    // Implementation needed by parent component
  }
}