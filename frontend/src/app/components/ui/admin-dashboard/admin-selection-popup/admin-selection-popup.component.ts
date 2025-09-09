import { Component, input, output, signal, computed, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { AdminUser } from '../../../../models/contact.model';

@Component({
  selector: 'app-admin-selection-popup',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ConfirmPopupModule,
    DropdownModule,
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
    <p-confirmPopup key="admin-selection-popup">
      <ng-template pTemplate="content" let-message>
        <div class="admin-selection-popup">
          <div class="popup-header">
            <i class="pi pi-user-plus text-primary-500 text-2xl mb-2"></i>
            <p class="text-surface-600 dark:text-surface-400 mb-3">{{ popupMessage() }}</p>
          </div>
          
          @if (adminUsers().length > 0) {
            <div class="field">
              <label for="adminSelect" class="block text-sm font-medium mb-2">Select Admin User:</label>
              <p-dropdown
                id="adminSelect"
                [options]="adminOptions()"
                [(ngModel)]="selectedAdminId"
                optionLabel="label"
                optionValue="value"
                placeholder="Choose an admin..."
                [style]="{ width: '100%' }"
                [showClear]="true">
              </p-dropdown>
            </div>
          } @else {
            <div class="no-admins-message">
              <i class="pi pi-exclamation-triangle text-orange-500 mr-2"></i>
              <span>No admin users available for assignment</span>
            </div>
          }
        </div>
      </ng-template>
    </p-confirmPopup>
  `,
  styles: [`
    .admin-selection-popup {
      min-width: 280px;
      max-width: 350px;
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

    .no-admins-message {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem;
      background: var(--orange-50);
      border: 1px solid var(--orange-200);
      border-radius: 4px;
      color: var(--orange-700);
      font-size: 0.875rem;
      margin-bottom: 1rem;
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
    :host-context(.dark) .no-admins-message {
      background: var(--orange-900);
      border-color: var(--orange-700);
      color: var(--orange-300);
    }

    :host-context(.dark) .popup-header {
      border-color: var(--surface-700);
    }

    :host-context(.dark) .popup-actions {
      border-color: var(--surface-700);
    }
  `]
})
export class AdminSelectionPopupComponent {
  private confirmationService = inject(ConfirmationService);

  // Inputs
  adminUsers = input.required<AdminUser[]>();
  buttonIcon = input<string>('pi pi-user-plus');
  buttonLabel = input<string>('Assign Admin');
  buttonSeverity = input<'success' | 'info' | 'warning' | 'danger' | 'secondary'>('success');
  disabled = input<boolean>(false);
  tooltip = input<string>('Assign admin to this contact');
  popupTitle = input<string>('Assign Admin User');
  popupMessage = input<string>('Select an admin user to assign to this contact:');

  // Outputs
  adminSelected = output<AdminUser>();
  cancelled = output<void>();

  // Internal state
  selectedAdminId = signal<number | null>(null);

  // Computed properties
  adminOptions = computed(() => 
    this.adminUsers().map(admin => ({
      label: `${admin.username} (${admin.email})`,
      value: admin.id
    }))
  );

  showConfirmPopup(event: Event): void {
    // Reset selection
    this.selectedAdminId.set(null);

    // Show confirmation popup with proper accept/reject buttons
    this.confirmationService.confirm({
      key: 'admin-selection-popup',
      target: event.target as EventTarget,
      message: '', // Content handled by template
      header: this.popupTitle(),
      icon: 'pi pi-user-plus',
      acceptLabel: 'Assign',
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

  onConfirm(): void {
    const selectedId = this.selectedAdminId();
    
    if (selectedId) {
      const selectedAdmin = this.adminUsers().find(admin => admin.id === selectedId);
      
      if (selectedAdmin) {
        this.adminSelected.emit(selectedAdmin);
      }
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
