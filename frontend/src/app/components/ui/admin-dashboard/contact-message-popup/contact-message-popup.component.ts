import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-contact-message-popup',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ConfirmPopupModule,
    TooltipModule
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
    <p-confirmPopup key="contact-message-popup">
      <ng-template pTemplate="content" let-message>
        <div class="contact-message-popup">
          <div class="popup-header">
            <i class="pi pi-envelope text-secondary-500 text-2xl mb-2"></i>
            <h4 class="mb-2">{{ popupTitle() }}</h4>
            <div class="contact-info">
              <strong>From:</strong> {{ contactEmail() }}
            </div>
          </div>
          
          <div class="message-content">
            <label class="block text-sm font-medium mb-2">Message:</label>
            <div class="message-text">
              {{ contactMessage() }}
            </div>
            @if (contactMessage().length > maxPreviewLength()) {
              <div class="message-stats">
                <small class="text-surface-500">
                  Full message: {{ contactMessage().length }} characters
                </small>
              </div>
            }
          </div>
        </div>
      </ng-template>
      
      <ng-template pTemplate="footer">
        <div class="popup-actions">
          <p-button 
            label="Close" 
            severity="secondary"
            size="small"
            (onClick)="onClose()">
          </p-button>
        </div>
      </ng-template>
    </p-confirmPopup>
  `,
  styles: [`
    .contact-message-popup {
      min-width: 350px;
      max-width: 500px;
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

    .contact-info {
      margin-top: 0.5rem;
      color: var(--text-color-secondary);
      font-size: 0.9rem;
    }

    .message-content {
      margin-bottom: 1rem;
    }

    .message-content label {
      color: var(--text-color);
      font-weight: 500;
    }

    .message-text {
      background: var(--surface-50);
      border: 1px solid var(--surface-200);
      border-radius: 4px;
      padding: 0.75rem;
      color: var(--text-color);
      font-size: 0.9rem;
      line-height: 1.5;
      max-height: 300px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .message-stats {
      margin-top: 0.5rem;
      text-align: right;
    }

    .message-stats small {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .popup-actions {
      display: flex;
      justify-content: center;
      border-top: 1px solid var(--surface-200);
      padding-top: 0.75rem;
    }

    /* Dark mode support */
    :host-context(.dark) .popup-header {
      border-color: var(--surface-700);
    }

    :host-context(.dark) .popup-actions {
      border-color: var(--surface-700);
    }

    :host-context(.dark) .message-text {
      background: var(--surface-800);
      border-color: var(--surface-700);
    }

    /* Scrollbar styling for message content */
    .message-text::-webkit-scrollbar {
      width: 6px;
    }

    .message-text::-webkit-scrollbar-track {
      background: var(--surface-100);
      border-radius: 3px;
    }

    .message-text::-webkit-scrollbar-thumb {
      background: var(--surface-300);
      border-radius: 3px;
    }

    .message-text::-webkit-scrollbar-thumb:hover {
      background: var(--surface-400);
    }

    :host-context(.dark) .message-text::-webkit-scrollbar-track {
      background: var(--surface-700);
    }

    :host-context(.dark) .message-text::-webkit-scrollbar-thumb {
      background: var(--surface-600);
    }

    :host-context(.dark) .message-text::-webkit-scrollbar-thumb:hover {
      background: var(--surface-500);
    }
  `]
})
export class ContactMessagePopupComponent {
  private confirmationService = inject(ConfirmationService);

  // Inputs
  contactEmail = input.required<string>();
  contactMessage = input.required<string>();
  buttonIcon = input<string>('pi pi-eye');
  buttonLabel = input<string>('View Message');
  buttonSeverity = input<'success' | 'info' | 'warning' | 'danger' | 'secondary'>('secondary');
  disabled = input<boolean>(false);
  tooltip = input<string>('View full contact message');
  popupTitle = input<string>('Contact Message');
  maxPreviewLength = input<number>(100);

  // Outputs
  closed = output<void>();

  showConfirmPopup(event: Event): void {
    // Show confirmation popup with unique key
    this.confirmationService.confirm({
      key: 'contact-message-popup', // Unique key for this popup
      target: event.target as EventTarget,
      message: '', // Content handled by template
      header: 'Contact Message',
      icon: 'pi pi-envelope',
      acceptVisible: false, // We'll handle buttons in template
      rejectVisible: false
    });
  }

  onClose(): void {
    this.closed.emit();
    this.confirmationService.close();
  }
}
