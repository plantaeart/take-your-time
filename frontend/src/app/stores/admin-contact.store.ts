import { Injectable, signal, computed, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { 
  ContactSubmission, 
  ContactUpdate,
  ContactListResponse,
  ContactStatus,
  AdminUser
} from '../models/contact.model';
import { AdminContactService } from '../services/admin-contact.service';

@Injectable({
  providedIn: 'root'
})
export class AdminContactStore {
  private adminContactService = inject(AdminContactService);
  private messageService = inject(MessageService);

  // State signals
  private _contactSubmissions = signal<ContactSubmission[]>([]);
  private _selectedContact = signal<ContactSubmission | null>(null);
  private _isLoading = signal<boolean>(false);
  private _isUpdating = signal<boolean>(false);
  private _isDeleting = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _pagination = signal<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Public readonly state
  readonly contactSubmissions = this._contactSubmissions.asReadonly();
  readonly selectedContact = this._selectedContact.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isUpdating = this._isUpdating.asReadonly();
  readonly isDeleting = this._isDeleting.asReadonly();
  readonly error = this._error.asReadonly();
  readonly pagination = this._pagination.asReadonly();

  // Computed states
  readonly isAnyOperationInProgress = computed(() => 
    this._isLoading() || this._isUpdating() || this._isDeleting()
  );

  readonly pendingContacts = computed(() =>
    this._contactSubmissions().filter(contact => contact.status === ContactStatus.PENDING)
  );

  readonly sentContacts = computed(() =>
    this._contactSubmissions().filter(contact => contact.status === ContactStatus.SENT)
  );

  readonly doneContacts = computed(() =>
    this._contactSubmissions().filter(contact => contact.status === ContactStatus.DONE)
  );

  readonly closedContacts = computed(() =>
    this._contactSubmissions().filter(contact => contact.status === ContactStatus.CLOSED)
  );

  readonly totalContacts = computed(() => this._contactSubmissions().length);

  /**
   * Load contact submissions with pagination and filtering
   */
  async loadContactSubmissions(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: ContactStatus;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.adminContactService.searchContactSubmissions(params)
      );
      
      this._contactSubmissions.set(response.items);
      this._pagination.set({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        hasNext: response.hasNext,
        hasPrev: response.hasPrev
      });
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to load contact submissions';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error', 
        summary: 'Load Error', 
        detail: errorMessage
      });
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Update contact submission (status and/or admin note)
   */
  async updateContactSubmission(contactId: number, updateData: ContactUpdate): Promise<boolean> {
    this._isUpdating.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.adminContactService.updateContactSubmission(contactId, updateData)
      );

      // Refresh the contact list to get updated data
      await this.loadContactSubmissions();

      // Show success message with specific details
      let updateMessage = 'Contact submission updated successfully';
      if (updateData.status) {
        updateMessage = `Contact status updated to ${updateData.status}`;
      }
      if (updateData.adminNote) {
        updateMessage += updateData.status ? ' and admin note added' : ' with admin note added';
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: updateMessage
      });

      return true;
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to update contact submission';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error',
        summary: 'Update Error',
        detail: errorMessage
      });
      return false;
    } finally {
      this._isUpdating.set(false);
    }
  }

  /**
   * Delete contact submission
   */
  async deleteContactSubmission(contactId: number): Promise<boolean> {
    this._isDeleting.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(
        this.adminContactService.deleteContactSubmission(contactId)
      );

      // Remove from local state
      const currentContacts = this._contactSubmissions();
      const filteredContacts = currentContacts.filter(contact => contact.id !== contactId);
      this._contactSubmissions.set(filteredContacts);

      // Update pagination totals
      const currentPagination = this._pagination();
      this._pagination.set({
        ...currentPagination,
        total: currentPagination.total - 1
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Contact submission deleted successfully'
      });

      return true;
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to delete contact submission';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error',
        summary: 'Delete Error',
        detail: errorMessage
      });
      return false;
    } finally {
      this._isDeleting.set(false);
    }
  }

  /**
   * Bulk delete contact submissions
   */
  async bulkDeleteContactSubmissions(contactIds: number[]): Promise<boolean> {
    this._isDeleting.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(
        this.adminContactService.bulkDeleteContactSubmissions(contactIds)
      );

      // Remove deleted contacts from local state
      const currentContacts = this._contactSubmissions();
      const filteredContacts = currentContacts.filter(contact => !contactIds.includes(contact.id));
      this._contactSubmissions.set(filteredContacts);

      // Update pagination totals
      const currentPagination = this._pagination();
      this._pagination.set({
        ...currentPagination,
        total: currentPagination.total - contactIds.length
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${contactIds.length} contact submissions deleted successfully`
      });

      return true;
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to delete contact submissions';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error',
        summary: 'Bulk Delete Error',
        detail: errorMessage
      });
      return false;
    } finally {
      this._isDeleting.set(false);
    }
  }

  /**
   * Set selected contact for detailed view
   */
  setSelectedContact(contact: ContactSubmission | null): void {
    this._selectedContact.set(contact);
  }

  /**
   * Unassign admin from contact submission
   */
  async unassignAdminFromContact(contactId: number): Promise<boolean> {
    this._isUpdating.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(
        this.adminContactService.unassignAdminFromContact(contactId)
      );

      // Refresh the contact list to get updated data
      await this.loadContactSubmissions();

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Admin unassigned from contact submission successfully'
      });

      return true;
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to unassign admin from contact submission';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error',
        summary: 'Unassign Error',
        detail: errorMessage
      });
      return false;
    } finally {
      this._isUpdating.set(false);
    }
  }

  /**
   * Assign admin to contact submission
   */
  async assignAdminToContact(contactId: number, adminId: number): Promise<boolean> {
    this._isUpdating.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(
        this.adminContactService.assignAdminToContact(contactId, adminId)
      );

      // Refresh the contact list to get updated data
      await this.loadContactSubmissions();

      return true;
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to assign admin to contact submission';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error',
        summary: 'Assign Error',
        detail: errorMessage
      });
      return false;
    } finally {
      this._isUpdating.set(false);
    }
  }

  /**
   * Add admin note to contact submission
   */
  async addAdminNoteToContact(contactId: number, note: string): Promise<boolean> {
    this._isUpdating.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(
        this.adminContactService.addAdminNoteToContact(contactId, note)
      );

      // Refresh the contact list to get updated data
      await this.loadContactSubmissions();

      return true;
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to add admin note to contact submission';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error',
        summary: 'Note Error',
        detail: errorMessage
      });
      return false;
    } finally {
      this._isUpdating.set(false);
    }
  }

  /**
   * Get admin users for assignment dropdown
   */
  async getAdminUsers(): Promise<AdminUser[]> {
    try {
      return await firstValueFrom(
        this.adminContactService.getAdminUsers()
      );
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to load admin users';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error',
        summary: 'Load Error',
        detail: errorMessage
      });
      return [];
    }
  }

  /**
   * Clear all state
   */
  clearState(): void {
    this._contactSubmissions.set([]);
    this._selectedContact.set(null);
    this._error.set(null);
    this._pagination.set({
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    });
  }
}
