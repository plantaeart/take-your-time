import { inject } from '@angular/core';
import { UserManagementStore } from '../stores/user-management.store';
import { User } from '../models/user.model';

/**
 * Hook for user CRUD operations (Create, Update, Delete)
 * Does NOT include search functionality - use useAdminUserSearch for that
 */
export function useUserManagement() {
  const userManagementStore = inject(UserManagementStore);

  return {
    // State access
    isUpdating: userManagementStore.isUpdating,
    isDeleting: userManagementStore.isDeleting,
    isPerformingAction: userManagementStore.isPerformingAction,
    error: userManagementStore.error,
    lastOperation: userManagementStore.lastOperation,
    isAnyOperationInProgress: userManagementStore.isAnyOperationInProgress,

    // CRUD operations
    async updateUser(id: number, userData: Partial<{ username: string; email: string; isActive: boolean }>): Promise<User> {
      try {
        return await userManagementStore.updateUser(id, userData);
      } catch (error) {
        console.error('❌ useUserManagement: Update failed:', error);
        throw error;
      }
    },

    async deleteUser(id: number): Promise<void> {
      try {
        await userManagementStore.deleteUser(id);
      } catch (error) {
        console.error('❌ useUserManagement: Delete failed:', error);
        throw error;
      }
    },

    async activateUser(id: number): Promise<void> {
      try {
        await userManagementStore.activateUser(id);
      } catch (error) {
        console.error('❌ useUserManagement: Activate failed:', error);
        throw error;
      }
    },

    async deactivateUser(id: number): Promise<void> {
      try {
        await userManagementStore.deactivateUser(id);
      } catch (error) {
        console.error('❌ useUserManagement: Deactivate failed:', error);
        throw error;
      }
    },

    async getUserById(id: number): Promise<User> {
      try {
        return await userManagementStore.getUserById(id);
      } catch (error) {
        console.error('❌ useUserManagement: Get user by ID failed:', error);
        throw error;
      }
    },

    // Utility actions
    clearError: () => userManagementStore.clearError(),
    reset: () => userManagementStore.reset()
  };
}
