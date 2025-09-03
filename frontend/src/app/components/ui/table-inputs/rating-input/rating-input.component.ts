import { Component, input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RatingModule } from 'primeng/rating';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-rating-input',
  standalone: true,
  imports: [CommonModule, FormsModule, RatingModule, InputNumberModule],
  template: `
    @if (useStars()) {
      <p-rating
        [ngModel]="value"
        (ngModelChange)="onValueChange($event)"
        [stars]="stars()"
        [cancel]="allowCancel()"
        [disabled]="disabled()"
        [class.p-invalid]="invalid()">
      </p-rating>
    } @else {
      <input
        type="text"
        [value]="displayValue"
        (input)="onInputChange($event)"
        (blur)="onBlur()"
        (focus)="onFocus()"
        (keydown)="onKeyDown($event)"
        [disabled]="disabled()"
        [class.p-invalid]="invalid()"
        class="p-inputtext p-component w-full"
        placeholder="0.0"
        inputmode="decimal">
    }
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RatingInputComponent),
      multi: true
    }
  ]
})
export class RatingInputComponent implements ControlValueAccessor {
  // Inputs
  stars = input<number>(5);
  useStars = input<boolean>(false); // Use star display vs number input
  allowCancel = input<boolean>(true);
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);

  // Internal value
  value: number | null = null;
  private inputBuffer: string = ''; // For handling sequential digit entry

  // ControlValueAccessor methods
  private onChange = (value: number | null) => {};
  private onTouched = () => {};

  get displayValue(): string {
    try {
      if (this.value !== null && this.value !== undefined) {
        // Show comma as decimal separator for better UX
        return this.value.toString().replace('.', ',');
      }
      return '';
    } catch (error) {
      console.warn('Error in rating-input displayValue:', error);
      return '';
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    // Allow: backspace, delete, tab, escape, enter, decimal point, comma
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    
    if (allowedKeys.includes(event.key)) {
      return;
    }
    
    // Allow decimal separators
    if (event.key === '.' || event.key === ',') {
      const input = event.target as HTMLInputElement;
      // Prevent multiple decimal separators
      if (input.value.includes('.') || input.value.includes(',')) {
        event.preventDefault();
      }
      return;
    }
    
    // Allow digits 0-9
    if (event.key >= '0' && event.key <= '9') {
      return;
    }
    
    // Block everything else
    event.preventDefault();
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value.trim();
    
    // Replace comma with dot for parsing
    inputValue = inputValue.replace(',', '.');
    
    // Handle empty input
    if (inputValue === '') {
      this.value = null;
      this.onChange(null);
      return;
    }
    
    // Handle single digit smart entry for ratings
    if (inputValue.match(/^\d$/) && !inputValue.includes('.')) {
      const digit = parseInt(inputValue);
      
      // For ratings, if someone types a single digit 1-5, auto-add .0
      // For digits above max stars, treat as decimal (e.g., "4" -> "4.0", "7" -> "0.7" if max is 5)
      if (digit >= 1 && digit <= this.stars()) {
        this.processRatingValue(digit);
        return;
      } else if (digit > this.stars()) {
        // If digit is above max stars, treat as decimal (e.g., "7" -> "0.7")
        const decimalValue = digit / 10;
        this.processRatingValue(decimalValue);
        return;
      }
    }
    
    // Handle two consecutive digits (like "14" -> "1.4")
    if (inputValue.match(/^\d{2}$/) && !inputValue.includes('.')) {
      const firstDigit = parseInt(inputValue.charAt(0));
      const secondDigit = parseInt(inputValue.charAt(1));
      
      // Convert "14" to "1.4", "23" to "2.3", etc.
      const decimalValue = firstDigit + (secondDigit / 10);
      this.processRatingValue(decimalValue);
      
      // Update the input display to show the decimal format
      input.value = decimalValue.toString().replace('.', ',');
      return;
    }
    
    // Handle decimal input normally
    const numericValue = parseFloat(inputValue);
    if (!isNaN(numericValue) && isFinite(numericValue)) {
      this.processRatingValue(numericValue);
    } else {
      input.value = this.displayValue.replace('.', ',');
    }
  }

  private processRatingValue(value: number): void {
    // Validate range
    if (value < 0) {
      value = 0;
    } else if (value > this.stars()) {
      value = this.stars();
    }
    
    // Round to 1 decimal place
    value = Math.round(value * 10) / 10;
    
    this.value = value;
    this.onChange(this.value);
  }

  onFocus(): void {
    // Clear buffer on focus
    this.inputBuffer = '';
  }

  onBlur(): void {
    this.onTouched();
  }

  onValueChange(value: number | null): void {
    if (value !== null) {
      this.processRatingValue(value);
    } else {
      this.value = null;
      this.onChange(null);
    }
    
    this.onTouched();
  }

  writeValue(value: number | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handle disabled state if needed
  }
}
