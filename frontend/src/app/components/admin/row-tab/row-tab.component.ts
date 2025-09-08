import { Component, input, output, signal, computed, effect, inject, ViewContainerRef, ComponentRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TableManagementConfig, ColumnConfig, HierarchyConfig } from '../object-management-config/table-config.interface';
import { TextInputComponent } from '../../ui/table-inputs/text-input/text-input.component';
import { DropdownInputComponent } from '../../ui/table-inputs/dropdown-input/dropdown-input.component';
import { CurrencyInputComponent } from '../../ui/table-inputs/currency-input/currency-input.component';
import { NumberInputComponent } from '../../ui/table-inputs/number-input/number-input.component';
import { TextareaInputComponent } from '../../ui/table-inputs/textarea-input/textarea-input.component';
import { RatingInputComponent } from '../../ui/table-inputs/rating-input/rating-input.component';
import { UploadInputComponent } from '../../ui/table-inputs/upload-input/upload-input.component';
import { CheckboxInputComponent } from '../../ui/table-inputs/checkbox-input/checkbox-input.component';
import { QuantityControlsComponent } from '../../ui/quantity-controls/quantity-controls.component';
import { ProductSelectComponent } from '../../ui/product-select/product-select.component';

@Component({
  selector: 'app-row-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    TagModule,
    TooltipModule,
    TextInputComponent,
    DropdownInputComponent,
    CurrencyInputComponent,
    NumberInputComponent,
    TextareaInputComponent,
    RatingInputComponent,
    UploadInputComponent,
    CheckboxInputComponent,
    QuantityControlsComponent,
    ProductSelectComponent
  ],
  templateUrl: './row-tab.component.html',
  styleUrl: './row-tab.component.css'
})
export class RowTabComponent<T = any> {
  // Services
  private messageService = inject(MessageService);
  
  // Inputs
  item = input.required<T>();
  columns = input.required<ColumnConfig[]>();
  config = input.required<TableManagementConfig<T>>();
  isEditing = input<boolean>(false);
  isSelected = input<boolean>(false);
  showSelect = input<boolean>(false);
  
  // Hierarchical inputs
  hierarchyLevel = input<number>(0);
  canExpand = input<boolean>(false);
  isExpanded = input<boolean>(false);
  isLoadingChildren = input<boolean>(false);
  hierarchyConfig = input<HierarchyConfig | null>(null);
  isNew = input<boolean>(false);
  isCartEmpty = input<boolean>(false); // For cart empty state styling
  
  // Outputs
  edit = output<void>();
  save = output<Partial<T>>();  // Pass the data when saving
  cancel = output<void>();
  delete = output<void>();
  toggleSelect = output<void>();
  toggleExpansion = output<void>(); // New output for hierarchy expansion
  customAction = output<{ action: string; item: T; actionData?: any }>(); // Custom action output

  // Internal state for editing
  editData = signal<Partial<T>>({});
  private isInitialized = signal<boolean>(false);
  
  // Hierarchical computed properties
  hierarchyIndentStyle = computed(() => {
    const level = this.hierarchyLevel();
    const config = this.hierarchyConfig();
    const indentSize = config?.indentSize || 20;
    return {
      'padding-left': `${level * indentSize}px`
    };
  });
  
  expandIcon = computed(() => {
    const config = this.hierarchyConfig();
    if (this.isExpanded()) {
      return config?.collapseIcon || 'pi pi-chevron-down';
    }
    return config?.expandIcon || 'pi pi-chevron-right';
  });
  
  // Helper to create array for hierarchy indentation
  Array = Array;
  
  rowClass = computed(() => {
    const level = this.hierarchyLevel();
    const baseClass = 'table-row';
    const levelClass = `hierarchy-level-${level}`;
    return `${baseClass} ${levelClass}`;
  });
  
  customActions = computed(() => {
    return this.config().actions.customActions || [];
  });
  
  // Effect to initialize edit data when editing starts
  constructor() {
    effect(() => {
      try {
        if (this.isEditing() && !this.isInitialized()) {
          if (this.isNew()) {
            // For new items, start with empty data
            this.editData.set({});
          } else {
            // For existing items, populate edit data with current item values
            const currentItem = this.item();
            if (currentItem && typeof currentItem === 'object' && Object.keys(currentItem).length > 0) {
              // Deep copy the current item to edit data to ensure dropdowns get populated
              this.editData.set({ ...currentItem });
            } else {
              this.editData.set({});
            }
          }
          this.isInitialized.set(true);
        } else if (!this.isEditing()) {
          // Clear edit data when not editing and reset initialization flag
          this.editData.set({});
          this.isInitialized.set(false);
        }
      } catch (error) {
        console.warn('Error in editing effect:', error);
        // Fallback to safe state
        this.editData.set({});
        this.isInitialized.set(false);
      }
    }, { allowSignalWrites: true });
  }

  // ============= ACTION METHODS =============
  
  onEdit(): void {
    this.edit.emit();
  }

  onSave(): void {
    // Validate all fields before saving
    const editableColumns = this.columns().filter(col => col.editable);
    const invalidColumns = editableColumns.filter(col => !this.isFieldValid(col));
    
    if (invalidColumns.length > 0) {
      // Show toast notification for validation errors
      const fieldNames = invalidColumns.map(col => col.header || col.field).join(', ');
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: `Please fix the following fields: ${fieldNames}`,
        life: 5000
      });
      return;
    }
    
    // Emit the save event with the current edit data
    const dataToSave = this.isNew() ? this.editData() : { ...this.item(), ...this.editData() };
    this.save.emit(dataToSave as Partial<T>);
  }

  onCancel(): void {
    this.editData.set({});
    this.cancel.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }

  onCustomAction(action: any): void {
    this.customAction.emit({
      action: action.action,
      item: this.item(),
      actionData: action
    });
  }

  onToggleSelect(): void {
    this.toggleSelect.emit();
  }

  onToggleExpansion(): void {
    this.toggleExpansion.emit();
  }

  // ============= DATA METHODS =============
  
  getColumnValue(columnOrField: ColumnConfig | string): any {
    try {
      let fieldName: string;
      
      if (typeof columnOrField === 'string') {
        fieldName = columnOrField;
      } else {
        if (!columnOrField || !columnOrField.field) {
          return null;
        }
        fieldName = columnOrField.field;
      }

      // Handle calculated fields for cart total value
      if (fieldName === 'cartTotalValue') {
        const itemData = this.item() as any;
        if (itemData && itemData.cart && Array.isArray(itemData.cart)) {
          return itemData.cart.reduce((total: number, item: any) => 
            total + (item.quantity * item.productPrice), 0);
        }
        return 0;
      }

      // Handle calculated fields for cart item subtotal
      if (fieldName === 'subtotal') {
        if (this.isEditing()) {
          // During editing, calculate subtotal from edit data
          const editData = this.editData() as any;
          const itemData = this.item() as any;
          
          const quantity = editData.hasOwnProperty('quantity') ? editData.quantity : itemData?.quantity;
          const productPrice = editData.hasOwnProperty('productPrice') ? editData.productPrice : itemData?.productPrice;
          
          if (quantity && productPrice) {
            return quantity * productPrice;
          }
        } else {
          // Not editing, use original item data
          const itemData = this.item() as any;
          if (itemData && itemData.quantity && itemData.productPrice) {
            return itemData.quantity * itemData.productPrice;
          }
        }
        return 0;
      }

      if (this.isEditing()) {
        // During editing, first check edit data, then original item data
        const editData = this.editData() as any;
        const itemData = this.item() as any;
        
        // If we have edit data for this field, use it (including null values)
        if (editData && editData.hasOwnProperty(fieldName)) {
          const value = editData[fieldName];
          return value;
        }
        
        // Otherwise, use the original item data
        const value = itemData ? itemData[fieldName] : null;
        return value;
      } else {
        // Not editing, use item data
        const itemData = this.item() as any;
        const value = itemData ? itemData[fieldName] : null;
        return value;
      }
    } catch (error) {
      console.warn('Error in getColumnValue:', error, 'columnOrField:', columnOrField);
      return null;
    }
  }

  setColumnValue(column: ColumnConfig, value: any): void {
    const currentData = { ...this.editData() };
    (currentData as any)[column.field] = value;
    this.editData.set(currentData);
    
    // Clear product cache when any field changes to prevent stale data
    this._productCache = null;
  }

  getDisplayValue(column: ColumnConfig): string {
    try {
      const value = this.getColumnValue(column);
      
      if (value === null || value === undefined) {
        return '-';
      }

      switch (column.type) {
        case 'number':
          if (column.displayFormat === 'currency') {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(value);
          } else if (column.displayFormat === 'rating') {
            return `${value} ⭐`;
          }
          return value?.toString() || '-';
        
        case 'enum':
          const option = column.options?.find(opt => opt.value === value);
          return option?.label || (value?.toString() || '-');
          
        case 'boolean':
          return value ? 'Yes' : 'No';
          
        case 'date':
          return new Date(value).toLocaleDateString();
          
        case 'image':
          return value ? 'Image' : 'No image';
          
        default:
          return value?.toString() || '-';
      }
    } catch (error) {
      console.warn('Error in getDisplayValue:', error, 'column:', column);
      return '-';
    }
  }

  getTagSeverity(column: ColumnConfig): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" | undefined {
    const value = this.getColumnValue(column);
    const option = column.options?.find(opt => opt.value === value);
    
    // Use color from option if available, otherwise map to severity
    const color = option?.color || 'secondary';
    
    // Map color strings to PrimeNG severity values
    switch (color.toLowerCase()) {
      case 'green':
      case 'success':
        return 'success';
      case 'blue':
      case 'info':
        return 'info';
      case 'yellow':
      case 'warning':
        return 'warning';
      case 'red':
      case 'danger':
        return 'danger';
      case 'contrast':
        return 'contrast';
      default:
        return 'secondary';
    }
  }

  // ============= VALIDATION METHODS =============
  
  isFieldRequired(column: ColumnConfig): boolean {
    return column.required || false;
  }

  isFieldValid(column: ColumnConfig): boolean {
    const value = this.getColumnValue(column);
    
    // For required fields, check if value exists and is not empty
    if (column.required) {
      // For enum fields (dropdown), check if value is a valid enum option
      if (column.type === 'enum' && column.options) {
        const isValidOption = column.options.some(option => option.value === value);
        return isValidOption;
      }
      
      // For other fields, check if value is not null/undefined/empty
      return value !== null && value !== undefined && value !== '';
    }
    
    // Non-required fields are always valid
    return true;
  }

  public validateField(value: any, validation: any): boolean {
    // Simplified validation - backend handles detailed validation
    if (validation.rule === 'required') {
      return value !== null && value !== undefined && value !== '';
    }
    return true;
  }

  // ============= HELPER METHODS =============
  
  canEdit(): boolean {
    return this.config().actions.canEdit || false;
  }

  canDelete(): boolean {
    return this.config().actions.canDelete || false;
  }

  hasCustomActions(): boolean {
    return (this.config().actions.customActions?.length || 0) > 0;
  }

  executeCustomAction(action: any): void {
    // Emit custom action event with action type and item data
    this.customAction.emit({
      action: action.action,
      item: this.item(),
      actionData: action
    });
  }

  shouldShowCustomAction(action: any): boolean {
    if (!action.condition) return true;
    return action.condition(this.item());
  }

  // ============= PRODUCT SELECT METHODS =============
  
  getSelectedProduct(column: ColumnConfig): any {
    // For product selection, we need to return the full product object
    // The productName field would typically contain just the product name for display
    // but for the ProductSelectComponent, we need the full product object
    
    const productId = this.getColumnValue('productId');
    const productName = this.getColumnValue(column);
    
    // If we have productId and productName, create a basic product object
    // Use object caching to prevent infinite loops
    if (productId && productName) {
      // Create a simple consistent object that won't trigger unnecessary updates
      const productKey = `${productId}-${productName}`;
      if (!this._productCache || this._productCache.key !== productKey) {
        this._productCache = {
          key: productKey,
          product: {
            id: productId,
            name: productName
          }
        };
      }
      return this._productCache.product;
    }
    
    return null;
  }
  
  // Cache for product selection to prevent infinite loops
  private _productCache: { key: string; product: any } | null = null;
  
  getExistingCartProductIds(): number[] {
    // This method should return product IDs that are already in the cart
    // to exclude them from the product selection dropdown
    
    // For now, return empty array - this would be populated by the parent component
    // or could be passed as an input if needed
    return [];
  }
  
  onProductSelected(product: any): void {
    // When a product is selected, update multiple fields in one batch
    if (product) {
      const currentData = { ...this.editData() };
      
      // Update all fields at once to minimize change detection cycles
      (currentData as any)['productId'] = product.id;
      (currentData as any)['productName'] = product.name;
      if (product.price) {
        (currentData as any)['productPrice'] = product.price;
      }
      // Set product stock quantity to enable quantity controls
      if (product.quantity !== undefined) {
        (currentData as any)['productStockQuantity'] = product.quantity;
      }
      // Set initial quantity to 1
      (currentData as any)['quantity'] = 1;
      
      // Update the signal once with all changes
      this.editData.set(currentData);
      this._productCache = null; // Clear cache
    } else {
      // When product is unselected (null), clear all product-related fields
      const currentData = { ...this.editData() };
      (currentData as any)['productId'] = null;
      (currentData as any)['productName'] = '';
      (currentData as any)['productPrice'] = null;
      (currentData as any)['productStockQuantity'] = 0;
      (currentData as any)['quantity'] = 1;
      
      // Update the signal with cleared fields
      this.editData.set(currentData);
      this._productCache = null; // Clear cache
    }
  }
}
