import { Component, input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FileUploadModule } from 'primeng/fileupload';

@Component({
  selector: 'app-upload-input',
  standalone: true,
  imports: [CommonModule, FormsModule, FileUploadModule],
  template: `
    <div class="upload-input-container">
      <p-fileUpload 
        mode="basic"
        [disabled]="disabled()"
        accept="image/*"
        [auto]="false"
        [showUploadButton]="false"
        [showCancelButton]="false"
        [class.p-invalid]="invalid()"
        class="w-full disabled-upload">
      </p-fileUpload>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UploadInputComponent),
      multi: true
    }
  ]
})
export class UploadInputComponent implements ControlValueAccessor {
  // Inputs
  disabled = input<boolean>(true); // Always disabled for now
  invalid = input<boolean>(false);

  // Internal value (will always be null for now)
  value: string | null = null;

  // ControlValueAccessor methods
  private onChange = (value: string | null) => {};
  private onTouched = () => {};

  writeValue(value: string | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Component is always disabled for now
  }
}
