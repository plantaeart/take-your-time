import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  ContactSubmission, 
  ContactSubmissionsResponse, 
  ContactUpdate, 
  ContactResponse,
  ContactListResponse,
  ContactStatus,
  AdminUser
} from '../models/contact.model';

@Injectable({
  providedIn: 'root'
})
export class AdminContactService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  /**
   * Get contact submissions with pagination, filtering, and sorting
   */
  searchContactSubmissions(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: ContactStatus;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Observable<ContactListResponse> {
    const { page = 1, limit = 10, search, status, sortField, sortOrder } = params;
    
    // Calculate skip value for backend
    const skip = (page - 1) * limit;
    
    let httpParams = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());
    
    // Handle search filter
    if (search) {
      httpParams = httpParams.set('search', search);
    }
    
    // Handle status filter
    if (status) {
      httpParams = httpParams.set('status', status);
    }
    
    // Handle sorting
    if (sortField && sortOrder) {
      httpParams = httpParams
        .set('sortField', sortField)
        .set('sortOrder', sortOrder);
    }

    return this.http.get<ContactSubmissionsResponse>(`${this.baseUrl}/api/contact/admin/submissions`, { params: httpParams })
      .pipe(
        // Transform backend response to frontend pagination format
        map((response: ContactSubmissionsResponse) => {
          const totalPages = Math.ceil(response.total / limit);
          return {
            items: response.submissions,
            total: response.total,
            page: page,
            limit: limit,
            totalPages: totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          } as ContactListResponse;
        })
      );
  }

  /**
   * Get specific contact submission details
   */
  getContactSubmission(contactId: number): Observable<ContactSubmission> {
    return this.http.get<ContactSubmission>(`${this.baseUrl}/api/contact/admin/${contactId}`);
  }

  /**
   * Update contact submission (status and/or admin note)
   */
  updateContactSubmission(contactId: number, updateData: ContactUpdate): Observable<ContactResponse> {
    return this.http.put<ContactResponse>(`${this.baseUrl}/api/contact/admin/${contactId}`, updateData);
  }

  /**
   * Delete contact submission
   */
  deleteContactSubmission(contactId: number): Observable<ContactResponse> {
    return this.http.delete<ContactResponse>(`${this.baseUrl}/api/contact/admin/${contactId}`);
  }

  /**
   * Bulk delete contact submissions
   */
  bulkDeleteContactSubmissions(contactIds: number[]): Observable<ContactResponse> {
    return this.http.request<ContactResponse>('DELETE', `${this.baseUrl}/api/contact/admin/bulk`, {
      body: contactIds
    });
  }

  /**
   * Unassign admin from contact submission
   */
  unassignAdminFromContact(contactId: number): Observable<ContactResponse> {
    return this.http.patch<ContactResponse>(`${this.baseUrl}/api/contact/admin/${contactId}/unassign`, {});
  }

  /**
   * Assign admin to contact submission
   */
  assignAdminToContact(contactId: number, adminId: number): Observable<ContactResponse> {
    return this.http.patch<ContactResponse>(`${this.baseUrl}/api/contact/admin/${contactId}/assign`, { adminId });
  }

  /**
   * Add admin note to contact submission
   */
  addAdminNoteToContact(contactId: number, note: string): Observable<ContactResponse> {
    return this.http.patch<ContactResponse>(`${this.baseUrl}/api/contact/admin/${contactId}/note`, { note });
  }

  /**
   * Get all admin users for assignment dropdown
   */
  getAdminUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.baseUrl}/api/admin/users/admins`);
  }
}
