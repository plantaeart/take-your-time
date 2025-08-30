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
      <p-inputNumber
        [ngModel]="value"
        (ngModelChange)="onValueChange($event)"
        [min]="0"
        [max]="stars()"
        [step]="0.1"
        [disabled]="disabled()"
        [class.p-invalid]="invalid()"
        placeholder="0.0"
        class="w-full">
      </p-inputNumber>
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
