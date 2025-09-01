import { Component, input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-number-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <input
      type="text"
      [value]="displayValue"
      (input)="onInputChange($event)"
      (blur)="onBlur()"
      (focus)="onFocus()"
      (keydown)="onKeyDown($event)"
      [disabled]="disabled"
      [class.p-invalid]="invalid()"
      class="p-inputtext p-component w-full"
      placeholder=""
      inputmode="numeric">
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberInputComponent),
      multi: true
    }
  ]
})
export class NumberInputComponent implements ControlValueAccessor {
  // Inputs
  invalid = input<boolean>(false);

  // Internal state
  internalValue: number | null = null;
  disabled: boolean = false;

  // ControlValueAccessor methods
  private onChange = (value: number | null) => {};
  private onTouched = () => {};

  get displayValue(): string {
    return this.internalValue !== null ? this.internalValue.toString() : '';
  }

  onKeyDown(event: KeyboardEvent): void {
    // Allow: backspace, delete, tab, escape, enter, decimal point
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    
    if (allowedKeys.includes(event.key)) {
      return; // Allow these keys
    }
    
    // Allow decimal point if not already present
    if (event.key === '.' && !(event.target as HTMLInputElement).value.includes('.')) {
      return;
    }
    
    // Allow numbers
    if (event.key >= '0' && event.key <= '9') {
      return;
    }
    
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }
    
    // Prevent all other keys
    event.preventDefault();
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const stringValue = input.value.trim();
    
    // Allow completely empty input
    if (stringValue === '') {
      this.internalValue = null;
      this.onChange(null);
      return;
    }
    
    // Allow just a decimal point (for typing decimals)
    if (stringValue === '.') {
      return; // Don't update the value yet, wait for more input
    }
    
    // Parse the numeric value
    const numericValue = parseFloat(stringValue);
    
    // Check if it's a valid number
    if (!isNaN(numericValue) && isFinite(numericValue)) {
      this.internalValue = numericValue;
      this.onChange(numericValue);
    } else {
      // Invalid input - revert to previous valid value
      input.value = this.displayValue;
    }
  }

  onBlur(): void {
    // On blur, ensure touched state is set
    // The value will already be properly set from onInputChange
    this.onTouched();
  }

  onFocus(): void {
    // Called when input gains focus
  }

  writeValue(value: number | null): void {
    this.internalValue = value;
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
