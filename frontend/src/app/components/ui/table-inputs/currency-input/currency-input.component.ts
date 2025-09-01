import { Component, input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-currency-input',
  standalone: true,
  imports: [CommonModule, FormsModule, InputNumberModule],
  template: `
    <p-inputNumber
      [ngModel]="value"
      (ngModelChange)="onValueChange($event)"
      mode="currency"
      [currency]="currency()"
      [locale]="locale()"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [minFractionDigits]="1"
      [maxFractionDigits]="1"
      [disabled]="disabled()"
      [class.p-invalid]="invalid()"
      class="w-full">
    </p-inputNumber>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyInputComponent),
      multi: true
    }
  ]
})
export class CurrencyInputComponent implements ControlValueAccessor {
  // Inputs
  currency = input<string>('USD');
  locale = input<string>('en-US');
  min = input<number>(0);
  max = input<number | null>(null);
  step = input<number>(0.1);
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);

  // Internal value
  value: number | null = null;

  // ControlValueAccessor methods
  private onChange = (value: number | null) => {};
  private onTouched = () => {};

  onValueChange(value: number | null): void {
    this.value = value;
    this.onChange(this.value);
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
