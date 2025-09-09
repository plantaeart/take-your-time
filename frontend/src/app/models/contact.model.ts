/**
 * Contact form models for API requests and responses.
 */

export interface ContactRequest {
  email: string;
  message: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

export interface AdminNoteResponse {
  adminId: number;
  note: string;
  createdAt: string;
}

export interface ContactSubmission {
  id: number;
  email: string;
  message: string;
  userId?: number;
  status: ContactStatus;
  adminId?: number;          // ID of admin currently reviewing this submission
  messageId?: string;
  errorMessage?: string;
  adminNotes: AdminNoteResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactSubmissionsResponse {
  submissions: ContactSubmission[];
  total: number;
  skip: number;
  limit: number;
}

export interface ContactUpdate {
  status?: ContactStatus;
  adminNote?: string;
}

export enum ContactStatus {
  SENT = 'SENT',       // User sent the contact submission
  PENDING = 'PENDING', // Admin is reviewing the submission
  DONE = 'DONE',       // Admin has reviewed and completed
  CLOSED = 'CLOSED'    // User has validated the changes/response
}

export interface ContactListResponse {
  items: ContactSubmission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
