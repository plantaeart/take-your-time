import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ContactRequest, ContactResponse, ContactSubmissionsResponse } from '../models/contact.model';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Send contact form message
   */
  sendContactMessage(contactData: ContactRequest): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(`${this.apiUrl}/api/contact/send`, contactData);
  }

  /**
   * Get contact submissions (Admin only)
   */
  getContactSubmissions(skip: number = 0, limit: number = 50): Observable<ContactSubmissionsResponse> {
    const params = { skip: skip.toString(), limit: limit.toString() };
    return this.http.get<ContactSubmissionsResponse>(`${this.apiUrl}/api/contact/admin/submissions`, { params });
  }
}
