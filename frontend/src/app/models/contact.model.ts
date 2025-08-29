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

export interface ContactSubmission {
  id: number;
  email: string;
  message: string;
  userId?: number;
  status: ContactStatus;
  messageId?: string;
  errorMessage?: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContactSubmissionsResponse {
  submissions: ContactSubmission[];
  total: number;
  skip: number;
  limit: number;
}

export enum ContactStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED'
}
