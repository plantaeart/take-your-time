import { Component, input, output, signal, computed, effect, inject, ViewContainerRef, ComponentRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TableManagementConfig, ColumnConfig } from '../object-management-config/table-config.interface';
import { TextInputComponent } from '../../ui/table-inputs/text-input/text-input.component';
import { DropdownInputComponent } from '../../ui/table-inputs/dropdown-input/dropdown-input.component';
import { CurrencyInputComponent } from '../../ui/table-inputs/currency-input/currency-input.component';
import { NumberInputComponent } from '../../ui/table-inputs/number-input/number-input.component';
import { TextareaInputComponent } from '../../ui/table-inputs/textarea-input/textarea-input.component';
import { RatingInputComponent } from '../../ui/table-inputs/rating-input/rating-input.component';
import { UploadInputComponent } from '../../ui/table-inputs/upload-input/upload-input.component';
import { CheckboxInputComponent } from '../../ui/table-inputs/checkbox-input/checkbox-input.component';

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
    CheckboxInputComponent
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
  isNew = input<boolean>(false);
  showSelect = input<boolean>(true);
  
  // Outputs
  edit = output<void>();
  save = output<Partial<T>>();  // Pass the data when saving
  cancel = output<void>();
  delete = output<void>();
  toggleSelect = output<void>();

  // Internal state for editing
  editData = signal<Partial<T>>({});
  private isInitialized = signal<boolean>(false);
  
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

  onToggleSelect(): void {
    this.toggleSelect.emit();
  }

  // ============= DATA METHODS =============
  
  getColumnValue(column: ColumnConfig): any {
    try {
      if (!column || !column.field) {
        return null;
      }

      if (this.isEditing()) {
        // During editing, first check edit data, then original item data
        const editData = this.editData() as any;
        const itemData = this.item() as any;
        
        // If we have edit data for this field, use it (including null values)
        if (editData && editData.hasOwnProperty(column.field)) {
          const value = editData[column.field];
          return value;
        }
        
        // Otherwise, use the original item data
        const value = itemData ? itemData[column.field] : null;
        return value;
      } else {
        // Not editing, use item data
        const itemData = this.item() as any;
        const value = itemData ? itemData[column.field] : null;
        return value;
      }
    } catch (error) {
      console.warn('Error in getColumnValue:', error, 'column:', column);
      return null;
    }
  }

  setColumnValue(column: ColumnConfig, value: any): void {
    const currentData = { ...this.editData() };
    (currentData as any)[column.field] = value;
    this.editData.set(currentData);
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
    // Emit custom action event - parent component should handle this
  }

  shouldShowCustomAction(action: any): boolean {
    if (!action.condition) return true;
    return action.condition(this.item());
  }
}
