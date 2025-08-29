import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { Category, CategoryLabels, CategoryColors, CategoryHexColors } from '../../../enums/category.enum';

export interface FilterItem {
  key: string;
  label: string;
  selected: boolean;
  category?: Category; // Add optional category for coloring
}

export interface CategoryOption {
  label: string;
  value: string;
  category: Category;
  color: string;
}

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [
    CommonModule,
    MultiSelectModule,
    ButtonModule,
    FormsModule
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.css'
})
export class FilterComponent {
  @Input() title: string = 'Filter';
  @Input() items: FilterItem[] = [];
  @Input() allowMultiple: boolean = true;
  @Input() showClearButton: boolean = true;

  @Output() filterChange = new EventEmitter<FilterItem[]>();
  @Output() clearFilters = new EventEmitter<void>();

  // Track current filters and selected values
  currentFilters = signal<FilterItem[]>([]);
  selectedValues: string[] = []; // Regular property for ngModel binding
  
  // Category options for MultiSelect
  categoryOptions: CategoryOption[] = [];

  ngOnInit() {
    this.initializeCategoryOptions();
    this.initializeFilters();
  }

  ngOnChanges() {
    this.initializeCategoryOptions();
    this.initializeFilters();
  }

  /**
   * Initialize category options with colors
   */
  private initializeCategoryOptions(): void {
    this.categoryOptions = this.items.map(item => ({
      label: item.label,
      value: item.key,
      category: item.category || Category.ELECTRONICS, // fallback
      color: this.getCategoryColor(item.category || Category.ELECTRONICS)
    }));
  }

  /**
   * Initialize filters and selected values
   */
  private initializeFilters(): void {
    this.currentFilters.set([...this.items]);
    const selected = this.items.filter(item => item.selected).map(item => item.key);
    this.selectedValues = selected;
  }

  /**
   * Get category color mapping
   */
  private getCategoryColor(category: Category): string {
    return CategoryHexColors[category] || CategoryHexColors[Category.ELECTRONICS];
  }

  /**
   * Handle MultiSelect change
   */
  onSelectionChange(selectedKeys: string[]): void {
    this.selectedValues = selectedKeys;
    
    const updatedFilters = this.currentFilters().map(filter => ({
      ...filter,
      selected: selectedKeys.includes(filter.key)
    }));

    this.currentFilters.set(updatedFilters);
    this.filterChange.emit(updatedFilters);
  }

  /**
   * Clear all filters
   */
  onClearFilters(): void {
    this.selectedValues = [];
    
    const clearedFilters = this.currentFilters().map(filter => ({
      ...filter,
      selected: false
    }));

    this.currentFilters.set(clearedFilters);
    this.clearFilters.emit();
    this.filterChange.emit(clearedFilters);
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    return this.selectedValues.length > 0;
  }

  /**
   * Get count of active filters
   */
  getActiveFilterCount(): number {
    return this.selectedValues.length;
  }
}
