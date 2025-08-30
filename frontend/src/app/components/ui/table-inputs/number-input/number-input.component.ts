import { Component, input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-number-input',
  standalone: true,
  imports: [CommonModule, FormsModule, InputNumberModule],
  template: `
    <p-inputNumber
      [ngModel]="value"
      (ngModelChange)="onValueChange($event)"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [showButtons]="showButtons()"
      [disabled]="disabled()"
      [class.p-invalid]="invalid()"
      class="w-full">
    </p-inputNumber>
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
  min = input<number>(0);
  max = input<number | null>(null);
  step = input<number>(1);
  showButtons = input<boolean>(true);
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
