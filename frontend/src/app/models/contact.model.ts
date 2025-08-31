/**
 * Contact form models for API requests and responses.
 */

export interface ContactRequest {
  email: string;
  message: string;
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
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED'
}
