import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';

export interface FilterButtonConfig {
  field: string;
  header: string;
  filterType: 'text' | 'number' | 'dropdown' | 'multiselect' | 'daterange' | 'boolean';
  options?: { label: string; value: any }[];
  currentValue?: any;
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
}
