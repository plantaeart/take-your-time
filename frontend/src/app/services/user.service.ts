import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

/**
 * User Service for admin user management CRUD operations
 * Note: Search/Read operations are handled by AdminSearchService
 * Following Angular 18 best practices with HttpClient
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/api/admin`;

  /**
   * Update a user
   */
  async updateUser(id: number, userData: Partial<{ username: string; email: string; isActive: boolean }>): Promise<User> {
    try {
      const updatedUser = await firstValueFrom(this.http.put<User>(`${this.apiUrl}/users/${id}`, userData));
      return updatedUser!;
    } catch (error: any) {
      console.error('❌ UserService: Failed to update user:', error);
      throw new Error(error.error?.detail || error.message || 'Failed to update user');
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(id: number): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/users/${id}`));
    } catch (error: any) {
      console.error('❌ UserService: Failed to delete user:', error);
      throw new Error(error.error?.detail || error.message || 'Failed to delete user');
    }
  }

  /**
   * Activate a user
   */
  async activateUser(id: number): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/users/${id}/activate`, {}));
    } catch (error: any) {
      console.error('❌ UserService: Failed to activate user:', error);
      throw new Error(error.error?.detail || error.message || 'Failed to activate user');
    }
  }

  /**
   * Deactivate a user
   */
  async deactivateUser(id: number): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/users/${id}/deactivate`, {}));
    } catch (error: any) {
      console.error('❌ UserService: Failed to deactivate user:', error);
      throw new Error(error.error?.detail || error.message || 'Failed to deactivate user');
    }
  }

  /**
   * Get a specific user by ID (for editing purposes)
   */
  async getUserById(id: number): Promise<User> {
    try {
      const user = await firstValueFrom(this.http.get<User>(`${this.apiUrl}/users/${id}`));
      return user!;
    } catch (error: any) {
      console.error('❌ UserService: Failed to get user:', error);
      throw new Error(error.error?.detail || error.message || 'Failed to get user');
    }
  }
}
