import { Component, input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';

export interface DropdownOption {
  label: string;
  value: any;
  color?: string;
}

@Component({
  selector: 'app-dropdown-input',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule],
  template: `
    <p-dropdown
      [options]="options()"
      [ngModel]="value"
      (ngModelChange)="onSelectionChange($event)"
      [placeholder]="placeholder()"
      [disabled]="disabled()"
      [showClear]="showClear()"
      optionLabel="label"
      optionValue="value"
      [class.p-invalid]="invalid()"
      class="w-full">
    </p-dropdown>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownInputComponent),
      multi: true
    }
  ]
})
export class DropdownInputComponent implements ControlValueAccessor {
  // Inputs
  options = input<DropdownOption[]>([]);
  placeholder = input<string>('Select...');
  disabled = input<boolean>(false);
  showClear = input<boolean>(true);
  invalid = input<boolean>(false);

  // Internal value
  value: any = null;

  // ControlValueAccessor methods
  private onChange = (value: any) => {};
  private onTouched = () => {};

  onSelectionChange(value: any): void {
    this.value = value;
    this.onChange(this.value);
    this.onTouched();
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handle disabled state if needed
  }
}
