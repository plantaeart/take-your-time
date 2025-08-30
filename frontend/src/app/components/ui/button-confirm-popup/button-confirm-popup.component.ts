import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';

export interface FilterButtonConfig {
  field: string;
  header: string;
  filterType: 'text' | 'number' | 'dropdown' | 'multiselect' | 'daterange' | 'boolean' | 'range';
  options?: { label: string; value: any }[];
  currentValue?: any;
  min?: number;
  max?: number;
  step?: number;
  displayFormat?: string; // For formatting the range display
}

@Component({
  selector: 'app-button-confirm-popup',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    OverlayPanelModule,
    InputTextModule,
    DropdownModule,
    MultiSelectModule,
    SliderModule,
    TooltipModule,
    FormsModule
  ],
  templateUrl: './button-confirm-popup.component.html',
  styleUrl: './button-confirm-popup.component.css'
})
export class ButtonConfirmPopupComponent {
  // Inputs
  config = input.required<FilterButtonConfig>();
  buttonIcon = input<string>('pi pi-filter');
  buttonTooltip = input<string>('Filter');
  buttonSeverity = input<'secondary' | 'info'>('secondary');
  
  // Outputs
  apply = output<any>();
  clear = output<void>();
  
  // Internal state
  isVisible = signal(false);
  currentValue = signal<any>('');
  
  // Computed properties
  buttonSeverityComputed = computed(() => {
    const hasValue = this.config().currentValue !== undefined && this.config().currentValue !== '';
    return hasValue ? 'info' : this.buttonSeverity();
  });
  
  ngOnInit() {
    // Initialize current value from config
    this.currentValue.set(this.config().currentValue || '');
  }
  
  togglePopup(overlayPanel: any, event: Event): void {
    if (this.isVisible()) {
      overlayPanel.hide();
    } else {
      // Reset value to current config value when opening
      this.currentValue.set(this.config().currentValue || '');
      overlayPanel.show(event);
    }
  }
  
  onShow(): void {
    this.isVisible.set(true);
  }
  
  onHide(): void {
    this.isVisible.set(false);
  }
  
  onApply(overlayPanel: any): void {
    this.apply.emit(this.currentValue());
    overlayPanel.hide();
  }
  
  onClear(overlayPanel: any): void {
    this.currentValue.set('');
    this.clear.emit();
    overlayPanel.hide();
  }
  
  updateValue(value: any): void {
    this.currentValue.set(value);
  }
  
  getRangeDisplay(): string {
    const value = this.currentValue();
    const config = this.config();
    
    if (Array.isArray(value) && value.length === 2) {
      // Format based on displayFormat or field name
      if (config.displayFormat === 'currency') {
        return `$${value[0]} - $${value[1]}`;
      } else if (config.displayFormat === 'rating') {
        return `${value[0]} - ${value[1]} ⭐`;
      } else {
        // Handle decimal places for different field types
        const formatted0 = Number.isInteger(value[0]) ? value[0] : value[0].toFixed(1);
        const formatted1 = Number.isInteger(value[1]) ? value[1] : value[1].toFixed(1);
        return `${formatted0} - ${formatted1}`;
      }
    }
    
    const min = config.min || 0;
    const max = config.max || 100;
    
    // Default display format
    if (config.displayFormat === 'currency') {
      return `$${min} - $${max}`;
    } else if (config.displayFormat === 'rating') {
      return `${min} - ${max} ⭐`;
    } else {
      const formattedMin = Number.isInteger(min) ? min : min.toFixed(1);
      const formattedMax = Number.isInteger(max) ? max : max.toFixed(1);
      return `${formattedMin} - ${formattedMax}`;
    }
  }
}
