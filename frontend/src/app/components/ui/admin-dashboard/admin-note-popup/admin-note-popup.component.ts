import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-note-popup',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ConfirmPopupModule,
    InputTextareaModule,
    TooltipModule,
    FormsModule
  ],
  template: `
    <!-- Trigger Button -->
    <p-button 
      [icon]="buttonIcon()"
      [label]="buttonLabel()"
      [severity]="buttonSeverity()"
      size="small"
      [text]="true"
      [disabled]="disabled()"
      (onClick)="showConfirmPopup($event)"
      [pTooltip]="tooltip()">
    </p-button>

    <!-- Confirm Popup -->
    <p-confirmPopup key="admin-note-popup">
      <ng-template pTemplate="content" let-message>
        <div class="admin-note-popup">
          <div class="popup-header">
            <i class="pi pi-comment text-info-500 text-2xl mb-2"></i>
            <p class="text-surface-600 dark:text-surface-400 mb-3">{{ popupMessage() }}</p>
          </div>
          
          <div class="field">
            <label for="adminNote" class="block text-sm font-medium mb-2">Admin Note:</label>
            <textarea
              id="adminNote"
              pInputTextarea
              [(ngModel)]="noteText"
              (ngModelChange)="onNoteTextChange($event)"
              [placeholder]="placeholder()"
              [rows]="4"
              [cols]="30"
              [maxlength]="maxLength()"
              [style]="{ width: '100%', resize: 'vertical' }"
              [class.p-invalid]="!isValidNote()">
            </textarea>
            <small class="text-surface-500 mt-1">
              {{ noteText().length }}/{{ maxLength() }} characters
            </small>
          </div>
        </div>
      </ng-template>
    </p-confirmPopup>
  `,
  styles: [`
    .admin-note-popup {
      min-width: 300px;
      max-width: 400px;
      padding: 0.5rem;
    }

    .popup-header {
      text-align: center;
      border-bottom: 1px solid var(--surface-200);
      padding-bottom: 0.75rem;
      margin-bottom: 1rem;
    }

    .popup-header h4 {
      margin: 0;
      color: var(--text-color);
      font-weight: 600;
      font-size: 1.1rem;
    }

    .field {
      margin-bottom: 1rem;
    }

    .field label {
      color: var(--text-color);
      font-weight: 500;
    }

    .popup-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      border-top: 1px solid var(--surface-200);
      padding-top: 0.75rem;
      margin-top: 1rem;
    }

    /* Ensure footer is visible */
    :host ::ng-deep .p-confirm-popup-footer {
      display: block !important;
      padding: 0 !important;
      border-top: none !important;
    }

    /* Dark mode support */
    :host-context(.dark) .popup-header {
      border-color: var(--surface-700);
    }

    :host-context(.dark) .popup-actions {
      border-color: var(--surface-700);
    }

    /* Invalid state styling */
    textarea.p-invalid {
      border-color: var(--red-500);
    }

    small.text-surface-500 {
      display: block;
      font-size: 0.75rem;
    }
  `]
})
export class AdminNotePopupComponent {
  private confirmationService = inject(ConfirmationService);

  // Inputs
  buttonIcon = input<string>('pi pi-comment');
  buttonLabel = input<string>('Add Note');
  buttonSeverity = input<'success' | 'info' | 'warning' | 'danger' | 'secondary'>('info');
  disabled = input<boolean>(false);
  tooltip = input<string>('Add admin note to this contact');
  popupTitle = input<string>('Add Admin Note');
  popupMessage = input<string>('Enter a note to attach to this contact:');
  placeholder = input<string>('Enter your admin note here...');
  maxLength = input<number>(500);
  minLength = input<number>(1);

  // Outputs
  noteAdded = output<string>();
  cancelled = output<void>();

  // Internal state
  noteText = signal<string>('');

  // Computed properties
  isValidNote = signal<boolean>(false);

  constructor() {
    // Watch for note text changes to validate
    this.noteText.set('');
    this.updateValidation();
  }

  private updateValidation(): void {
    const text = this.noteText().trim();
    const valid = text.length >= this.minLength() && text.length <= this.maxLength();
    this.isValidNote.set(valid);
  }

  showConfirmPopup(event: Event): void {
    // Reset note text
    this.noteText.set('');
    this.updateValidation();

    // Show confirmation popup with proper accept/reject buttons
    this.confirmationService.confirm({
      key: 'admin-note-popup',
      target: event.target as EventTarget,
      message: '', // Content handled by template
      header: this.popupTitle(),
      icon: 'pi pi-comment',
      acceptLabel: 'Add Note',
      rejectLabel: 'Cancel',
      acceptVisible: true,
      rejectVisible: true,
      accept: () => {
        this.onConfirm();
      },
      reject: () => {
        this.onCancel();
      }
    });
  }

  onNoteTextChange(value: string): void {
    this.noteText.set(value);
    this.updateValidation();
  }

  onConfirm(): void {
    const text = this.noteText().trim();
    if (text && this.isValidNote()) {
      this.noteAdded.emit(text);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
