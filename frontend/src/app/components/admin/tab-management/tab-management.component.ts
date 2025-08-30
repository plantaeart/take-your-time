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
    return {
      field: column.field,
      header: column.header,
      filterType: column.filterType || 'text',
      options: column.options,
      currentValue: this.columnFilters()[column.field]
    };
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
    this.triggerDataLoad();
  }

  onGlobalFilter(event: any): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilterValue.set(value);
    this.triggerDataLoad();
  }

  clearFilters(): void {
    this.columnFilters.set({});
    this.globalFilterValue.set('');
    this.triggerDataLoad();
  }

  // ============= SORT METHODS =============
  
  onSort(field: string): void {
    const currentSort = this.sortState();
    const newOrder = currentSort.field === field && currentSort.order === 'asc' ? 'desc' : 'asc';
    
    this.sortState.set({ field, order: newOrder });
    this.triggerDataLoad();
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
    this.triggerDataLoad();
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
    const items = this.data();
    const selected = this.selectedItems();
    return items.length > 0 && selected.length === items.length;
  }

  toggleSelectAll(): void {
    const allSelected = this.isAllSelected();
    if (allSelected) {
      this.selectedItems.set([]);
    } else {
      this.selectedItems.set([...this.data()]);
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