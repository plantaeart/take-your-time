import { Component, input, output, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminSelectionPopupComponent } from '../admin-selection-popup/admin-selection-popup.component';
import { AdminNotePopupComponent } from '../admin-note-popup/admin-note-popup.component';
import { ContactMessagePopupComponent } from '../contact-message-popup/contact-message-popup.component';
import { AdminNotesPopupComponent } from '../admin-notes-popup/admin-notes-popup.component';
import { useAdminContact } from '../../../../hooks/admin-contact.hooks';
import { ContactSubmission, AdminUser } from '../../../../models/contact.model';

@Component({
  selector: 'app-contact-actions',
  standalone: true,
  imports: [
    CommonModule,
    AdminSelectionPopupComponent,
    AdminNotePopupComponent,
    ContactMessagePopupComponent,
    AdminNotesPopupComponent
  ],
  template: `
    <div class="contact-actions">
      <!-- Assign Admin Popup -->
      <app-admin-selection-popup
        [adminUsers]="adminUsers()"
        buttonIcon="pi pi-user-plus"
        buttonLabel=""
        buttonSeverity="success"
        tooltip="Assign admin to this contact"
        popupTitle="Assign Admin User"
        popupMessage="Select an admin user to assign to this contact:"
        (adminSelected)="onAdminAssigned($event)"
        (cancelled)="onActionCancelled()">
      </app-admin-selection-popup>

      <!-- Add Admin Note Popup -->
      <app-admin-note-popup
        buttonIcon="pi pi-comment"
        buttonLabel=""
        buttonSeverity="info"
        tooltip="Add admin note to this contact"
        popupTitle="Add Admin Note"
        popupMessage="Enter a note to attach to this contact:"
        placeholder="Enter your admin note here..."
        [maxLength]="500"
        [minLength]="1"
        (noteAdded)="onNoteAdded($event)"
        (cancelled)="onActionCancelled()">
      </app-admin-note-popup>

      <!-- View Full Message Popup -->
      <app-contact-message-popup
        [contactEmail]="contact().email"
        [contactMessage]="contact().message"
        buttonIcon="pi pi-eye"
        buttonLabel=""
        buttonSeverity="secondary"
        tooltip="View full contact message"
        popupTitle="Contact Message"
        [maxPreviewLength]="100"
        (closed)="onMessageViewed()">
      </app-contact-message-popup>

      <!-- View Admin Notes Popup -->
      <app-admin-notes-popup
        [adminNotes]="contact().adminNotes || []"
        buttonIcon="pi pi-list"
        buttonLabel=""
        buttonSeverity="info"
        [contactEmail]="contact().email"
        [dialogTitle]="'Admin Notes for ' + contact().email"
        (closed)="onNotesViewed()">
      </app-admin-notes-popup>
    </div>
  `,
  styles: [`
    .contact-actions {
      display: flex;
      gap: 0.25rem;
      align-items: center;
    }
  `]
})
export class ContactActionsComponent implements OnInit {
  private adminContact = useAdminContact();

  // Inputs
  contact = input.required<ContactSubmission>();

  // Outputs
  actionCompleted = output<{ action: string; success: boolean; message?: string }>();

  // State
  adminUsers = signal<AdminUser[]>([]);
  isLoading = signal<boolean>(false);

  async ngOnInit(): Promise<void> {
    await this.loadAdminUsers();
  }

  private async loadAdminUsers(): Promise<void> {
    try {
      this.isLoading.set(true);
      const users = await this.adminContact.getAdminUsers();
      this.adminUsers.set(users);
    } catch (error) {
      console.error('Failed to load admin users:', error);
      this.adminUsers.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onAdminAssigned(admin: AdminUser): Promise<void> {
    try {
      const success = await this.adminContact.assignAdminToContact(this.contact().id, admin.id);
      
      if (success) {
        this.actionCompleted.emit({
          action: 'assignAdmin',
          success: true,
          message: `Admin ${admin.username} assigned successfully`
        });
      } else {
        this.actionCompleted.emit({
          action: 'assignAdmin',
          success: false,
          message: 'Failed to assign admin'
        });
      }
    } catch (error: any) {
      this.actionCompleted.emit({
        action: 'assignAdmin',
        success: false,
        message: error.message || 'Failed to assign admin'
      });
    }
  }

  async onNoteAdded(note: string): Promise<void> {
    try {
      const success = await this.adminContact.addAdminNoteToContact(this.contact().id, note);
      if (success) {
        this.actionCompleted.emit({
          action: 'addAdminNote',
          success: true,
          message: 'Admin note added successfully'
        });
      } else {
        this.actionCompleted.emit({
          action: 'addAdminNote',
          success: false,
          message: 'Failed to add admin note'
        });
      }
    } catch (error: any) {
      this.actionCompleted.emit({
        action: 'addAdminNote',
        success: false,
        message: error.message || 'Failed to add admin note'
      });
    }
  }

  onMessageViewed(): void {
    // No action needed - viewing message is a read-only operation
    // No toast message required
  }

  onNotesViewed(): void {
    // No action needed - viewing notes is a read-only operation
    // No toast message required
  }

  onActionCancelled(): void {
    // No need to emit anything for cancellations
  }
}
