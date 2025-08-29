import { inject } from '@angular/core';
import { ContactStore } from '../stores/contact.store';
import { ContactRequest } from '../models/contact.model';

/**
 * Hook for contact form functionality
 */
export function useContact() {
  const contactStore = inject(ContactStore);

  return {
    // State
    isSubmitting: contactStore.isSubmitting,
    isLoading: contactStore.isLoading,
    lastResponse: contactStore.lastResponse,
    submissions: contactStore.submissions,
    submissionsTotal: contactStore.submissionsTotal,
    error: contactStore.error,
    hasSubmissions: contactStore.hasSubmissions,
    isSuccess: contactStore.isSuccess,

    // Actions
    sendMessage: (contactData: ContactRequest) => contactStore.sendMessage(contactData),
    loadSubmissions: (skip?: number, limit?: number) => contactStore.loadSubmissions(skip, limit),
    clearError: () => contactStore.clearError(),
    clearResponse: () => contactStore.clearResponse(),
    reset: () => contactStore.reset()
  };
}
