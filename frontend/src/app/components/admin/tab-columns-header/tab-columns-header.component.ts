import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonConfirmPopupComponent } from '../../ui/button-confirm-popup/button-confirm-popup.component';
import { ColumnConfig } from '../object-management-config/table-config.interface';
import { TableManagementConfig } from '../object-management-config/table-config.interface';
import { HierarchyConfig } from '../object-management-config/table-config.interface';

@Component({
  selector: 'app-tab-columns-header',
  standalone: true,
  imports: [CommonModule, ButtonConfirmPopupComponent],
  templateUrl: './tab-columns-header.component.html',
  styleUrl: './tab-columns-header.component.css'
})
export class TabColumnsHeaderComponent {
  // Required inputs
  columns = input.required<ColumnConfig[]>();
  config = input.required<TableManagementConfig<any>>();
  
  // Optional inputs
  hierarchyLevel = input<number>(0);
  showSelect = input<boolean>(false);
  hierarchyConfig = input<HierarchyConfig | null>(null);
  isAllSelected = input<boolean>(false);
  gridTemplateColumns = input<string>(''); // Add grid template columns support
  
  // Event outputs
  sort = output<string>();
  filterApply = output<{ field: string; value: any }>();
  filterClear = output<string>();
  toggleSelectAll = output<void>();
  
  /**
   * Get sort icon class based on current sort state
   */
  getSortIcon(field: string): string {
    // This would need to be passed from parent or managed globally
    return 'pi pi-sort';
  }
  
  /**
   * Handle sort click
   */
  onSort(field: string): void {
    this.sort.emit(field);
  }
  
  /**
   * Handle filter apply
   */
  onFilterApply(field: string, value: any): void {
    this.filterApply.emit({ field, value });
  }
  
  /**
   * Handle filter clear
   */
  onFilterClear(field: string): void {
    this.filterClear.emit(field);
  }
  
  /**
   * Handle select all toggle
   */
  onToggleSelectAll(): void {
    this.toggleSelectAll.emit();
  }
  
  /**
   * Get filter button configuration for a column
   */
  getFilterButtonConfig(column: ColumnConfig): any {
    return {
      header: column.header,
      field: column.field,
      type: column.type || 'text',
      placeholder: `Filter by ${column.header}`,
      column: column
    };
  }

  /**
   * Check if hierarchy is enabled
   */
  isHierarchyEnabled(): boolean {
    return this.hierarchyConfig()?.enabled || false;
  }
  
  /**
   * Get CSS class for the header row based on hierarchy level
   */
  getHeaderRowClass(): string {
    const level = this.hierarchyLevel();
    return `table-grid-header hierarchy-level-${level}`;
  }
  
  // Helper to create array for hierarchy indentation
  Array = Array;
}