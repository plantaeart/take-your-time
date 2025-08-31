import { Injectable, signal, computed } from '@angular/core';
import { ContactService } from '../services/contact.service';
import { ContactRequest, ContactResponse, ContactSubmission, ContactUpdate } from '../models/contact.model';

@Injectable({
  providedIn: 'root'
})
export class ContactStore {
  // Private signals for state management
  private _isLoading = signal(false);
  private _isSubmitting = signal(false);
  private _lastResponse = signal<ContactResponse | null>(null);
  private _submissions = signal<ContactSubmission[]>([]);
  private _submissionsTotal = signal(0);
  private _error = signal<string | null>(null);

  // Public readonly signals
  isLoading = this._isLoading.asReadonly();
  isSubmitting = this._isSubmitting.asReadonly();
  lastResponse = this._lastResponse.asReadonly();
  submissions = this._submissions.asReadonly();
  submissionsTotal = this._submissionsTotal.asReadonly();
  error = this._error.asReadonly();

  // Computed signals
  hasSubmissions = computed(() => this._submissions().length > 0);
  isSuccess = computed(() => this._lastResponse()?.success ?? false);

  constructor(private contactService: ContactService) {}

  /**
   * Send contact message
   */
  async sendMessage(contactData: ContactRequest): Promise<void> {
    this._isSubmitting.set(true);
    this._error.set(null);
    this._lastResponse.set(null);

    try {
      const response = await this.contactService.sendContactMessage(contactData).toPromise();
      this._lastResponse.set(response!);
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to send message. Please try again.';
      this._error.set(errorMessage);
    } finally {
      this._isSubmitting.set(false);
    }
  }

  /**
   * Load contact submissions (Admin only)
   */
  async loadSubmissions(skip: number = 0, limit: number = 50): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await this.contactService.getContactSubmissions(skip, limit).toPromise();
      this._submissions.set(response!.submissions);
      this._submissionsTotal.set(response!.total);
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to load submissions.';
      this._error.set(errorMessage);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Update contact submission (Admin only)
   */
  async updateSubmission(contactId: number, updateData: ContactUpdate): Promise<void> {
    this._error.set(null);

    try {
      const updatedSubmission = await this.contactService.updateContactSubmission(contactId, updateData).toPromise();
      
      // Update the submission in the local state
      const currentSubmissions = this._submissions();
      const updatedSubmissions = currentSubmissions.map(submission => 
        submission.id === contactId ? updatedSubmission! : submission
      );
      this._submissions.set(updatedSubmissions);
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to update submission.';
      this._error.set(errorMessage);
      throw error; // Re-throw to allow component to handle
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Clear last response
   */
  clearResponse(): void {
    this._lastResponse.set(null);
  }

  /**
   * Reset contact form state
   */
  reset(): void {
    this._error.set(null);
    this._lastResponse.set(null);
    this._isSubmitting.set(false);
  }
}
