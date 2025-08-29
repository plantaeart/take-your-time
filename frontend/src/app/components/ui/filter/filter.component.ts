import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { SliderModule } from 'primeng/slider';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { Category, CategoryLabels, CategoryColors, CategoryHexColors } from '../../../enums/category.enum';
import { InventoryStatus, InventoryStatusLabels, InventoryStatusColors } from '../../../enums/inventory-status.enum';
import { Product } from '../../../models/product.model';
import { useProductList } from '../../../hooks/product.hooks';

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

export interface InventoryStatusOption {
  label: string;
  value: string;
  status: InventoryStatus;
  severity: string;
  color: string;
}

export interface SortOption {
  label: string;
  value: string;
  field: string;
  order: 'asc' | 'desc';
}

export interface PriceRange {
  min: number | null;
  max: number | null;
}

export interface FilterConfig {
  showCategories?: boolean;
  showInventoryStatus?: boolean;
  showPriceRange?: boolean;
  showSorting?: boolean;
  priceMin?: number;
  priceMax?: number;
  sortOptions?: SortOption[];
}

export interface FilterChangeEvent {
  categories?: string[];
  inventoryStatuses?: string[];
  priceRange?: PriceRange;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [
    CommonModule,
    MultiSelectModule,
    ButtonModule,
    InputNumberModule,
    DropdownModule,
    SliderModule,
    SelectButtonModule,
    TooltipModule,
    FormsModule
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.css'
})
export class FilterComponent implements OnChanges {
  // Use hook pattern for product operations
  private readonly productList = useProductList();
  
  @Input() title: string = 'Filters';
  @Input() items: FilterItem[] = []; // Legacy support - will be deprecated
  @Input() allowMultiple: boolean = true;
  @Input() showClearButton: boolean = true;
  @Input() products: Product[] = [];
  @Input() config: FilterConfig = {
    showCategories: true,
    showInventoryStatus: false,
    showPriceRange: false,
    showSorting: false,
    priceMin: 0,
    priceMax: 1000
  };

  @Output() filterChange = new EventEmitter<FilterItem[]>(); // Legacy support
  @Output() filtersChange = new EventEmitter<FilterChangeEvent>(); // New comprehensive event
  @Output() clearFilters = new EventEmitter<void>();

  // Filter state
  selectedCategories: string[] = [];
  selectedInventoryStatuses: string[] = [];
  priceRange: PriceRange = { min: null, max: null };
  selectedSort: string = '';
  
  // Expandable filter state - Default to collapsed
  isExpanded = signal<boolean>(false);
  
  // Options for dropdowns
  categoryOptions: CategoryOption[] = [];
  inventoryStatusOptions: InventoryStatusOption[] = [];
  sortOptions: SortOption[] = [];

  // Price range slider values - Added back for slider support
  priceSliderValues: number[] = [0, 1000];
  
  // Flag to track if price range has been initialized
  private priceRangeInitialized = false;

  async ngOnInit() {
    await this.initializeOptions();
    this.initializeLegacySupport();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['products'] && this.products) {
      console.log('Products changed:', this.products.length);
    }
    await this.initializeOptions();
    this.initializeLegacySupport();
  }

  /**
   * Initialize all filter options
   */
  private async initializeOptions(): Promise<void> {
    this.initializeCategoryOptions();
    this.initializeInventoryStatusOptions();
    this.initializeSortOptions();
    await this.initializePriceRange(); // Wait for API call
  }

  /**
   * Initialize legacy support for backward compatibility
   */
  private initializeLegacySupport(): void {
    // Support old items input for categories
    if (this.items.length > 0) {
      this.selectedCategories = this.items.filter(item => item.selected).map(item => item.key);
    }
  }

  /**
   * Initialize category options with colors
   */
  private initializeCategoryOptions(): void {
    const categories = Object.values(Category);
    this.categoryOptions = categories.map(category => ({
      label: CategoryLabels[category],
      value: category,
      category: category,
      color: this.getCategoryColor(category)
    }));
  }

  /**
   * Initialize inventory status options
   */
  private initializeInventoryStatusOptions(): void {
    const statuses = Object.values(InventoryStatus);
    this.inventoryStatusOptions = statuses.map(status => ({
      label: this.getInventoryStatusLabel(status),
      value: status,
      status: status,
      severity: this.getInventoryStatusSeverity(status),
      color: this.getInventoryStatusColor(status)
    }));
  }

  /**
   * Initialize sort options
   */
  private initializeSortOptions(): void {
    const defaultSortOptions: SortOption[] = [
      { label: 'Price: Low to High', value: 'price_asc', field: 'price', order: 'asc' },
      { label: 'Price: High to Low', value: 'price_desc', field: 'price', order: 'desc' },
      { label: 'Name: A to Z', value: 'name_asc', field: 'name', order: 'asc' },
      { label: 'Name: Z to A', value: 'name_desc', field: 'name', order: 'desc' },
      { label: 'Newest First', value: 'updated_desc', field: 'updatedAt', order: 'desc' },
      { label: 'Oldest First', value: 'updated_asc', field: 'updatedAt', order: 'asc' }
    ];
    
    this.sortOptions = this.config.sortOptions || defaultSortOptions;
  }

  /**
   * Initialize price range from config (only once)
   */
  private async initializePriceRange(): Promise<void> {
    // Only initialize if not already done
    if (!this.priceRangeInitialized) {
      this.priceRange = { min: null, max: null };
      
      // Get max price from API once
      const maxPrice = await this.getMaxPriceFromAPI();
      
      this.priceSliderValues = [this.config.priceMin || 0, maxPrice];
      this.config.priceMax = maxPrice; // Update config for consistency
      this.priceRangeInitialized = true;
    }
  }

  /**
   * Get maximum price from API (simple one-time call)
   */
  private async getMaxPriceFromAPI(): Promise<number> {
    try {
      return await this.productList.getMaxPrice();
    } catch (error) {
      console.warn('Failed to get max price from API, using default:', error);
      return this.config.priceMax || 1000;
    }
  }

  /**
   * Get category color mapping
   */
  private getCategoryColor(category: Category): string {
    return CategoryHexColors[category] || CategoryHexColors[Category.ELECTRONICS];
  }

  /**
   * Get inventory status label
   */
  private getInventoryStatusLabel(status: InventoryStatus): string {
    switch (status) {
      case InventoryStatus.INSTOCK:
        return 'In Stock';
      case InventoryStatus.LOWSTOCK:
        return 'Low Stock';
      case InventoryStatus.OUTOFSTOCK:
        return 'Out of Stock';
      default:
        return status;
    }
  }

  /**
   * Get inventory status severity for PrimeNG
   */
  private getInventoryStatusSeverity(status: InventoryStatus): string {
    switch (status) {
      case InventoryStatus.INSTOCK:
        return 'success';
      case InventoryStatus.LOWSTOCK:
        return 'warning';
      case InventoryStatus.OUTOFSTOCK:
        return 'danger';
      default:
        return 'info';
    }
  }

  /**
   * Get inventory status color
   */
  private getInventoryStatusColor(status: InventoryStatus): string {
    return InventoryStatusColors[status] || InventoryStatusColors[InventoryStatus.INSTOCK];
  }

  /**
   * Handle category selection change
   */
  onCategoryChange(selectedCategories: string[] | null | undefined): void {
    this.selectedCategories = selectedCategories || [];
    this.emitFilterChanges();
    this.emitLegacyFilterChange(); // For backward compatibility
  }

  /**
   * Handle inventory status selection change
   */
  onInventoryStatusChange(selectedStatuses: string[] | null | undefined): void {
    this.selectedInventoryStatuses = selectedStatuses || [];
    this.emitFilterChanges();
  }

  /**
   * Handle price range change (from slider)
   */
  onPriceSliderChange(values: number[]): void {
    this.priceSliderValues = values;
    this.priceRange = {
      min: values[0] === (this.config.priceMin || 0) ? null : values[0],
      max: values[1] === (this.config.priceMax || 1000) ? null : values[1]
    };
    this.emitFilterChanges();
  }

  /**
   * Handle price input change
   */
  onPriceInputChange(): void {
    // Only update slider if the price range values are valid
    const minValue = this.priceRange.min;
    const maxValue = this.priceRange.max;
    
    if (minValue !== null && maxValue !== null && minValue <= maxValue) {
      this.priceSliderValues = [minValue, maxValue];
    }
    
    this.emitFilterChanges();
  }

  /**
   * Handle sort selection change
   */
  onSortChange(sortValue: string): void {
    this.selectedSort = sortValue;
    this.emitFilterChanges();
  }

  /**
   * Emit comprehensive filter changes
   */
  private emitFilterChanges(): void {
    const sortOption = this.sortOptions.find(opt => opt.value === this.selectedSort);
    
    const filterEvent: FilterChangeEvent = {
      categories: (this.selectedCategories && this.selectedCategories.length > 0) ? this.selectedCategories : undefined,
      inventoryStatuses: (this.selectedInventoryStatuses && this.selectedInventoryStatuses.length > 0) ? this.selectedInventoryStatuses : undefined,
      priceRange: (this.priceRange.min !== null || this.priceRange.max !== null) ? this.priceRange : undefined,
      sortBy: sortOption?.field || undefined,
      sortOrder: sortOption?.order || undefined
    };
    
    this.filtersChange.emit(filterEvent);
  }

  /**
   * Legacy support - emit old format filter change
   */
  private emitLegacyFilterChange(): void {
    const legacyFilters = this.categoryOptions.map(option => ({
      key: option.value,
      label: option.label,
      selected: this.selectedCategories.includes(option.value),
      category: option.category
    }));
    
    this.filterChange.emit(legacyFilters);
  }

  /**
   * Clear all filters
   */
  onClearFilters(): void {
    this.selectedCategories = [];
    this.selectedInventoryStatuses = [];
    this.priceRange = { min: null, max: null };
    this.selectedSort = '';
    
    // Reset slider to config range and allow re-initialization
    this.priceSliderValues = [this.config.priceMin || 0, this.config.priceMax || 1000];
    this.priceRangeInitialized = false;
    
    this.clearFilters.emit();
    this.emitFilterChanges();
    this.emitLegacyFilterChange();
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    return (this.selectedCategories && this.selectedCategories.length > 0) || 
           (this.selectedInventoryStatuses && this.selectedInventoryStatuses.length > 0) || 
           this.priceRange.min !== null || 
           this.priceRange.max !== null || 
           this.selectedSort !== '';
  }

  /**
   * Get count of active filters
   */
  getActiveFilterCount(): number {
    let count = 0;
    if (this.selectedCategories && this.selectedCategories.length > 0) count++;
    if (this.selectedInventoryStatuses && this.selectedInventoryStatuses.length > 0) count++;
    if (this.priceRange.min !== null || this.priceRange.max !== null) count++;
    if (this.selectedSort !== '') count++;
    return count;
  }

  /**
   * Get formatted price range display
   */
  getPriceRangeDisplay(): string {
    const currentMin = this.priceSliderValues[0];
    const currentMax = this.priceSliderValues[1];
    return `$${currentMin} - $${currentMax}`;
  }

  /**
   * Toggle filter expansion
   */
  toggleExpansion(): void {
    this.isExpanded.set(!this.isExpanded());
  }
}
