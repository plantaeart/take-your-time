import { Component, input, output, signal, computed, ViewContainerRef, ComponentRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TableManagementConfig, ColumnConfig } from '../object-management-config/table-config.interface';
import { TextInputComponent } from '../../ui/table-inputs/text-input/text-input.component';
import { DropdownInputComponent } from '../../ui/table-inputs/dropdown-input/dropdown-input.component';
import { CurrencyInputComponent } from '../../ui/table-inputs/currency-input/currency-input.component';
import { NumberInputComponent } from '../../ui/table-inputs/number-input/number-input.component';
import { TextareaInputComponent } from '../../ui/table-inputs/textarea-input/textarea-input.component';
import { RatingInputComponent } from '../../ui/table-inputs/rating-input/rating-input.component';

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
    RatingInputComponent
  ],
  templateUrl: './row-tab.component.html',
  styleUrl: './row-tab.component.css'
})
export class RowTabComponent<T = any> {
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
  save = output<void>();
  cancel = output<void>();
  delete = output<void>();
  toggleSelect = output<void>();

  // Internal state for editing
  editData = signal<Partial<T>>({});
  
  // Initialize edit data when editing starts
  ngOnInit(): void {
    if (this.isEditing()) {
      this.editData.set({ ...this.item() });
    }
  }

  ngOnChanges(): void {
    if (this.isEditing()) {
      this.editData.set({ ...this.item() });
    }
  }

  // ============= ACTION METHODS =============
  
  onEdit(): void {
    this.edit.emit();
  }

  onSave(): void {
    // The parent component will handle the actual saving
    // We just emit the save event with the current edit data
    this.save.emit();
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
    const data = this.isEditing() ? this.editData() : this.item();
    return (data as any)[column.field];
  }

  setColumnValue(column: ColumnConfig, value: any): void {
    const currentData = { ...this.editData() };
    (currentData as any)[column.field] = value;
    this.editData.set(currentData);
  }

  getDisplayValue(column: ColumnConfig): string {
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
        return value.toString();
      
      case 'enum':
        const option = column.options?.find(opt => opt.value === value);
        return option?.label || value;
        
      case 'boolean':
        return value ? 'Yes' : 'No';
        
      case 'date':
        return new Date(value).toLocaleDateString();
        
      case 'image':
        return value ? 'Image' : 'No image';
        
      default:
        return value.toString();
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
    
    // Basic required field validation - detailed validation handled by backend
    if (column.required && (value === null || value === undefined || value === '')) {
      return false;
    }
    
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
    console.log('Custom action:', action.action, 'for item:', this.item());
  }

  shouldShowCustomAction(action: any): boolean {
    if (!action.condition) return true;
    return action.condition(this.item());
  }
}
