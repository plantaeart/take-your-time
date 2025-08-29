import { inject } from '@angular/core';
import { AuthStore } from '../stores/auth.store';
import { UserLogin, UserCreate } from '../models/user.model';

/**
 * Authentication hooks for easy component integration
 */
export function useAuth() {
  const authStore = inject(AuthStore);

  return {
    // State
    user: authStore.user,
    token: authStore.token,
    isLoading: authStore.isLoading,
    isAuthenticated: authStore.isAuthenticated,
    isAdmin: authStore.isAdmin,
    userDisplayName: authStore.userDisplayName,
    isInitialized: authStore.isInitialized,

    // Actions
    login: (credentials: UserLogin) => authStore.login(credentials),
    register: (userData: UserCreate) => authStore.register(userData),
    registerOnly: (userData: UserCreate) => authStore.registerOnly(userData),
    logout: () => authStore.logout(),
    getAuthHeader: () => authStore.getAuthHeader(),
  };
}

/**
 * Auth state hook for read-only access
 */
export function useAuthState() {
  const authStore = inject(AuthStore);

  return {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isAdmin: authStore.isAdmin,
    userDisplayName: authStore.userDisplayName,
    isInitialized: authStore.isInitialized,
  };
}

/**
 * Auth actions hook for components that only need actions
 */
export function useAuthActions() {
  const authStore = inject(AuthStore);

  return {
    login: (credentials: UserLogin) => authStore.login(credentials),
    register: (userData: UserCreate) => authStore.register(userData),
    registerOnly: (userData: UserCreate) => authStore.registerOnly(userData),
    logout: () => authStore.logout(),
  };
}
