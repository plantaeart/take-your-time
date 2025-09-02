import { Component, input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-checkbox-input',
  standalone: true,
  imports: [CommonModule, FormsModule, CheckboxModule],
  template: `
    <div class="checkbox-input-container">
      <p-checkbox
        [binary]="true"
        [ngModel]="value"
        (ngModelChange)="onValueChange($event)"
        (onBlur)="onBlur()"
        [disabled]="disabled()"
        [class.p-invalid]="invalid()">
      </p-checkbox>
      @if (label()) {
        <label class="checkbox-label" (click)="toggleValue()">
          {{ label() }}
        </label>
      }
    </div>
  `,
  styles: [`
    .checkbox-input-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .checkbox-label {
      cursor: pointer;
      user-select: none;
      font-size: 0.875rem;
      color: var(--text-color);
    }
    
    .checkbox-label:hover {
      color: var(--primary-color);
    }
    
    :host ::ng-deep .p-checkbox {
      display: flex;
      align-items: center;
    }
    
    :host ::ng-deep .p-checkbox .p-checkbox-box {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      border: 2px solid var(--surface-border);
      background: var(--surface-card);
      transition: all 0.2s ease;
    }
    
    :host ::ng-deep .p-checkbox .p-checkbox-box:hover {
      border-color: var(--primary-color);
    }
    
    :host ::ng-deep .p-checkbox .p-checkbox-box.p-highlight {
      background: var(--primary-color);
      border-color: var(--primary-color);
    }
    
    :host ::ng-deep .p-checkbox .p-checkbox-box .p-checkbox-icon {
      width: 12px;
      height: 12px;
      color: white;
      font-weight: bold;
    }
    
    :host ::ng-deep .p-checkbox.p-invalid .p-checkbox-box {
      border-color: var(--red-500);
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxInputComponent),
      multi: true
    }
  ]
})
export class CheckboxInputComponent implements ControlValueAccessor {
  // Inputs
  label = input<string>('');
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);

  // Internal value
  value: boolean = false;

  // ControlValueAccessor methods
  private onChange = (value: boolean) => {};
  private onTouched = () => {};

  onValueChange(newValue: boolean): void {
    this.value = newValue;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  toggleValue(): void {
    if (!this.disabled()) {
      this.onValueChange(!this.value);
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: boolean): void {
    this.value = value || false;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handled via disabled input
  }
}
