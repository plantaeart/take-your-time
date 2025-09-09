import { Component, input, output, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { AccordionModule } from 'primeng/accordion';
import { TooltipModule } from 'primeng/tooltip';
import { AdminNoteResponse } from '../../../../models/contact.model';

@Component({
  selector: 'app-admin-notes-popup',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    AccordionModule,
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
      [disabled]="disabled() || adminNotes().length === 0"
      (onClick)="showDialog()"
      [pTooltip]="getTooltipText()">
    </p-button>

    <!-- Dialog -->
    <p-dialog 
      [(visible)]="visible"
      [header]="dialogTitle()"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="true"
      [style]="{ width: '600px', maxHeight: '80vh' }"
      [showHeader]="true">
      
      <div class="admin-notes-popup">
        @if (adminNotes().length === 0) {
          <div class="no-notes-message">
            <i class="pi pi-info-circle text-info-500 text-2xl mb-2"></i>
            <h4 class="mb-2">No Admin Notes</h4>
            <p class="text-surface-600 dark:text-surface-400">
              This contact submission doesn't have any admin notes yet.
            </p>
          </div>
        } @else {
          <div class="notes-header mb-3">
            <h5 class="mb-1">{{ adminNotes().length }} Admin Note{{ adminNotes().length > 1 ? 's' : '' }}</h5>
            <p class="text-surface-600 dark:text-surface-400 text-sm">
              Click on any note to expand or collapse it
            </p>
          </div>

          <!-- Accordion for admin notes -->
          <p-accordion [multiple]="true" class="admin-notes-accordion">
            @for (note of sortedNotes(); track note.createdAt) {
              <p-accordionTab>
                <ng-template pTemplate="header">
                  <div class="note-header-content">
                    <div class="note-meta">
                      <span class="note-date">{{ formatDate(note.createdAt) }}</span>
                      <span class="note-admin">Admin ID: {{ note.adminId }}</span>
                    </div>
                    <div class="note-preview">
                      {{ getPreview(note.note) }}
                    </div>
                  </div>
                </ng-template>
                
                <div class="note-content">
                  <div class="note-full-text">
                    {{ note.note }}
                  </div>
                  <div class="note-footer">
                    <small class="text-surface-500">
                      <i class="pi pi-clock mr-1"></i>
                      Added on {{ formatFullDate(note.createdAt) }}
                    </small>
                  </div>
                </div>
              </p-accordionTab>
            }
          </p-accordion>
        }
      </div>

      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <p-button 
            label="Close" 
            severity="secondary"
            size="small"
            (onClick)="closeDialog()">
          </p-button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .admin-notes-popup {
      min-height: 200px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .no-notes-message {
      text-align: center;
      padding: 2rem;
      color: var(--text-color-secondary);
    }

    .no-notes-message h4 {
      margin: 0;
      color: var(--text-color);
      font-weight: 600;
    }

    .notes-header h5 {
      margin: 0;
      color: var(--text-color);
      font-weight: 600;
      font-size: 1.1rem;
    }

    .admin-notes-accordion {
      width: 100%;
    }

    .note-header-content {
      width: 100%;
      padding: 0.5rem 0;
    }

    .note-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .note-date {
      color: var(--primary-color);
      font-weight: 500;
    }

    .note-admin {
      color: var(--text-color-secondary);
      background: var(--surface-100);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .note-preview {
      color: var(--text-color-secondary);
      font-style: italic;
      font-size: 0.9rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .note-content {
      padding: 1rem 0;
    }

    .note-full-text {
      background: var(--surface-50);
      border-left: 4px solid var(--primary-color);
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .note-footer {
      text-align: right;
      padding-top: 0.5rem;
      border-top: 1px solid var(--surface-200);
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    /* Dark mode support */
    :host-context(.dark) .note-admin {
      background: var(--surface-700);
      color: var(--text-color);
    }

    :host-context(.dark) .note-full-text {
      background: var(--surface-700);
      border-left-color: var(--primary-color);
    }

    :host-context(.dark) .note-footer {
      border-top-color: var(--surface-600);
    }

    /* Custom accordion styling */
    :host ::ng-deep .admin-notes-accordion .p-accordion-header {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 6px;
      margin-bottom: 0.5rem;
    }

    :host ::ng-deep .admin-notes-accordion .p-accordion-header:not(.p-disabled):hover {
      background: var(--surface-hover);
    }

    :host ::ng-deep .admin-notes-accordion .p-accordion-content {
      border: 1px solid var(--surface-border);
      border-top: none;
      border-radius: 0 0 6px 6px;
      margin-bottom: 0.5rem;
    }

    :host ::ng-deep .admin-notes-accordion .p-accordion-header.p-accordion-header-active {
      border-radius: 6px 6px 0 0;
      margin-bottom: 0;
    }
  `]
})
export class AdminNotesPopupComponent {
  // Inputs
  adminNotes = input.required<AdminNoteResponse[]>();
  buttonIcon = input<string>('pi pi-list');
  buttonLabel = input<string>('');
  buttonSeverity = input<'success' | 'info' | 'warning' | 'danger' | 'secondary'>('info');
  disabled = input<boolean>(false);
  contactEmail = input<string>('');
  dialogTitle = input<string>('Admin Notes');

  // Outputs
  closed = output<void>();

  // Internal state
  visible = signal<boolean>(false);

  // Computed properties
  sortedNotes = computed(() => {
    return [...this.adminNotes()].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  getTooltipText(): string {
    const count = this.adminNotes().length;
    if (count === 0) {
      return 'No admin notes available';
    }
    return `View ${count} admin note${count > 1 ? 's' : ''}`;
  }

  showDialog(): void {
    this.visible.set(true);
  }

  closeDialog(): void {
    this.visible.set(false);
    this.closed.emit();
  }

  getPreview(text: string): string {
    const maxLength = 80;
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatFullDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}
