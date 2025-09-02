import { Injectable, signal, computed, inject } from '@angular/core';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';

/**
 * User Management Store
 * Handles state for user CRUD operations (excluding search which is handled by AdminSearchStore)
 */
@Injectable({
  providedIn: 'root'
})
export class UserManagementStore {
  private userService = inject(UserService);

  // State signals
  private _isUpdating = signal<boolean>(false);
  private _isDeleting = signal<boolean>(false);
  private _isPerformingAction = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _lastOperation = signal<{
    type: 'update' | 'delete' | 'activate' | 'deactivate' | null;
    userId?: number;
    timestamp?: Date;
  }>({ type: null });

  // Public readonly state
  readonly isUpdating = this._isUpdating.asReadonly();
  readonly isDeleting = this._isDeleting.asReadonly();
  readonly isPerformingAction = this._isPerformingAction.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastOperation = this._lastOperation.asReadonly();

  // Computed states
  readonly isAnyOperationInProgress = computed(() => 
    this._isUpdating() || this._isDeleting() || this._isPerformingAction()
  );

  /**
   * Update a user
   */
  async updateUser(id: number, userData: Partial<{ username: string; email: string; isActive: boolean }>): Promise<User> {
    this._isUpdating.set(true);
    this._error.set(null);

    try {
      const updatedUser = await this.userService.updateUser(id, userData);
      
      this._lastOperation.set({
        type: 'update',
        userId: id,
        timestamp: new Date()
      });

      return updatedUser;
    } catch (error: any) {
      this._error.set(error.message || 'Failed to update user');
      throw error;
    } finally {
      this._isUpdating.set(false);
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(id: number): Promise<void> {
    this._isDeleting.set(true);
    this._error.set(null);

    try {
      await this.userService.deleteUser(id);
      
      this._lastOperation.set({
        type: 'delete',
        userId: id,
        timestamp: new Date()
      });
    } catch (error: any) {
      this._error.set(error.message || 'Failed to delete user');
      throw error;
    } finally {
      this._isDeleting.set(false);
    }
  }

  /**
   * Activate a user
   */
  async activateUser(id: number): Promise<void> {
    this._isPerformingAction.set(true);
    this._error.set(null);

    try {
      await this.userService.activateUser(id);
      
      this._lastOperation.set({
        type: 'activate',
        userId: id,
        timestamp: new Date()
      });
    } catch (error: any) {
      this._error.set(error.message || 'Failed to activate user');
      throw error;
    } finally {
      this._isPerformingAction.set(false);
    }
  }

  /**
   * Deactivate a user
   */
  async deactivateUser(id: number): Promise<void> {
    this._isPerformingAction.set(true);
    this._error.set(null);

    try {
      await this.userService.deactivateUser(id);
      
      this._lastOperation.set({
        type: 'deactivate',
        userId: id,
        timestamp: new Date()
      });
    } catch (error: any) {
      this._error.set(error.message || 'Failed to deactivate user');
      throw error;
    } finally {
      this._isPerformingAction.set(false);
    }
  }

  /**
   * Get a specific user by ID
   */
  async getUserById(id: number): Promise<User> {
    this._error.set(null);

    try {
      return await this.userService.getUserById(id);
    } catch (error: any) {
      this._error.set(error.message || 'Failed to get user');
      throw error;
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Reset all state
   */
  reset(): void {
    this._isUpdating.set(false);
    this._isDeleting.set(false);
    this._isPerformingAction.set(false);
    this._error.set(null);
    this._lastOperation.set({ type: null });
  }
}
