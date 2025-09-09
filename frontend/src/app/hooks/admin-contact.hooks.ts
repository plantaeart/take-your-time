import { inject } from '@angular/core';
import { AdminContactStore } from '../stores/admin-contact.store';
import { ContactSubmission, ContactUpdate, ContactStatus, AdminUser } from '../models/contact.model';

/**
 * Hook for admin contact management operations
 * Provides centralized access to contact store and actions
 */
export function useAdminContact() {
  const adminContactStore = inject(AdminContactStore);

  return {
    // State
    contactSubmissions: adminContactStore.contactSubmissions,
    selectedContact: adminContactStore.selectedContact,
    isLoading: adminContactStore.isLoading,
    isUpdating: adminContactStore.isUpdating,
    isDeleting: adminContactStore.isDeleting,
    error: adminContactStore.error,
    pagination: adminContactStore.pagination,
    isAnyOperationInProgress: adminContactStore.isAnyOperationInProgress,
    
    // Computed states
    pendingContacts: adminContactStore.pendingContacts,
    sentContacts: adminContactStore.sentContacts,
    doneContacts: adminContactStore.doneContacts,
    closedContacts: adminContactStore.closedContacts,
    totalContacts: adminContactStore.totalContacts,

    // Actions
    loadContactSubmissions: (params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: ContactStatus;
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}) => adminContactStore.loadContactSubmissions(params),
    
    updateContactSubmission: (contactId: number, updateData: ContactUpdate) => 
      adminContactStore.updateContactSubmission(contactId, updateData),
    
    deleteContactSubmission: (contactId: number) => 
      adminContactStore.deleteContactSubmission(contactId),
    
    bulkDeleteContactSubmissions: (contactIds: number[]) => 
      adminContactStore.bulkDeleteContactSubmissions(contactIds),
    
    unassignAdminFromContact: (contactId: number) => 
      adminContactStore.unassignAdminFromContact(contactId),
    
    assignAdminToContact: (contactId: number, adminId: number) =>
      adminContactStore.assignAdminToContact(contactId, adminId),
    
    addAdminNoteToContact: (contactId: number, note: string) =>
      adminContactStore.addAdminNoteToContact(contactId, note),
    
    getAdminUsers: () =>
      adminContactStore.getAdminUsers(),
    
    setSelectedContact: (contact: ContactSubmission | null) => 
      adminContactStore.setSelectedContact(contact),
    
    clearState: () => adminContactStore.clearState(),
  };
}
