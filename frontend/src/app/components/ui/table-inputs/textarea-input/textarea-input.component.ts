import { Component, input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputTextareaModule } from 'primeng/inputtextarea';

@Component({
  selector: 'app-textarea-input',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextareaModule],
  template: `
    <textarea
      pInputTextarea
      [value]="value"
      (input)="onInput($event)"
      (blur)="onBlur()"
      [placeholder]="placeholder()"
      [disabled]="disabled()"
      [rows]="rows()"
      [class.p-invalid]="invalid()"
      class="w-full">
    </textarea>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaInputComponent),
      multi: true
    }
  ]
})
export class TextareaInputComponent implements ControlValueAccessor {
  // Inputs
  placeholder = input<string>('');
  rows = input<number>(3);
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);

  // Internal value
  value: string = '';

  // ControlValueAccessor methods
  private onChange = (value: string) => {};
  private onTouched = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handle disabled state if needed
  }
}
