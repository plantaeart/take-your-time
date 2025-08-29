import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { User, UserLogin, UserCreate, AuthResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  // Private signals for state management
  private _user = signal<User | null>(null);
  private _token = signal<string | null>(null);
  private _isLoading = signal(false);
  private _isInitialized = signal(false);

  // Public readonly signals
  user = this._user.asReadonly();
  token = this._token.asReadonly();
  isLoading = this._isLoading.asReadonly();
  isInitialized = this._isInitialized.asReadonly();

  // Computed signals
  isAuthenticated = computed(() => this._user() !== null && this._token() !== null);
  isAdmin = computed(() => this._user()?.isAdmin ?? false);
  userDisplayName = computed(() => this._user()?.firstname ?? '');

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.initializeFromStorage();
  }

  /**
   * Initialize auth state from localStorage on app startup
   */
  private initializeFromStorage(): void {
    try {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        this._token.set(storedToken);
        this._user.set(userData);
        
        if (environment.debug) {
          console.log('Auth state restored from localStorage - user:', userData.username);
        }
        
        // Validate token in background (don't block initialization)
        this.validateSession();
      }
    } catch (error) {
      console.error('Error initializing auth from storage:', error);
      this.clearSession();
    }
    
    this._isInitialized.set(true);
  }

  /**
   * Login user
   */
  async login(credentials: UserLogin): Promise<boolean> {
    this._isLoading.set(true);
    
    try {
      if (environment.debug) {
        console.log('Starting login...');
      }
      const response = await firstValueFrom(this.authService.login(credentials));
      if (environment.debug) {
        console.log('Login response received:', response);
      }
      
      this.setSession(response);
      if (environment.debug) {
        console.log('Session set - user:', this._user(), 'token:', !!this._token(), 'isAuthenticated:', this.isAuthenticated());
      }
      
      this.messageService.add({
        severity: 'success',
        summary: 'Welcome Back!',
        detail: `Hello ${response.user.firstname}, you're logged in successfully.`
      });
      
      // Small delay to ensure auth state is properly set before navigation
      setTimeout(() => {
        if (environment.debug) {
          console.log('Navigating to /home...');
        }
        this.router.navigate(['/home']);
      }, 100);
      
      return true;
    } catch (error: any) {
      if (environment.debug) {
        console.error('Login error:', error);
      }
      this.messageService.add({
        severity: 'error',
        summary: 'Login Failed',
        detail: error.message
      });
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Register new user
   */
  async register(userData: UserCreate): Promise<boolean> {
    this._isLoading.set(true);
    
    try {
      const response = await firstValueFrom(this.authService.register(userData));
      
      this.setSession(response);
      this.messageService.add({
        severity: 'success',
        summary: 'Welcome!',
        detail: `Hello ${response.user.firstname}, your account has been created successfully.`
      });
      
      // Navigate to home page
      this.router.navigate(['/home']);
      return true;
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Registration Failed',
        detail: error.message
      });
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Register new user without auto-login (for auth component)
   */
  async registerOnly(userData: UserCreate): Promise<boolean> {
    this._isLoading.set(true);
    
    try {
      await firstValueFrom(this.authService.register(userData));
      
      // Don't set session - just show success message
      this.messageService.add({
        severity: 'success',
        summary: 'Registration Successful',
        detail: 'Please sign in with your new account'
      });
      
      return true;
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Registration Failed',
        detail: error.message
      });
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call backend to blacklist token
      await firstValueFrom(this.authService.logout());
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearSession();
      this.messageService.add({
        severity: 'info',
        summary: 'Logged Out',
        detail: 'You have been logged out successfully.'
      });
      this.router.navigate(['/auth']);
    }
  }

  /**
   * Handle session expiration
   */
  handleSessionExpired(): void {
    this.clearSession();
    this.messageService.add({
      severity: 'warn',
      summary: 'Session Expired',
      detail: 'Your session has expired. Please log in again.'
    });
    this.router.navigate(['/auth']);
  }

  /**
   * Validate current session
   */
  private async validateSession(): Promise<void> {
    try {
      const isValid = await firstValueFrom(this.authService.validateToken());
      if (!isValid) {
        if (environment.debug) {
          console.log('Session validation failed - token invalid');
        }
        this.handleSessionExpired();
      }
    } catch (error: any) {
      // Only clear session if it's a 401/403 error, not network errors
      if (error.status === 401 || error.status === 403) {
        if (environment.debug) {
          console.log('Unauthorized error - clearing session');
        }
        this.clearSession();
      }
    }
  }

  /**
   * Set session data (token and user)
   */
  private setSession(authResponse: AuthResponse): void {
    this._token.set(authResponse.access_token);
    this._user.set(authResponse.user);
    
    // Store in localStorage
    localStorage.setItem('auth_token', authResponse.access_token);
    localStorage.setItem('auth_user', JSON.stringify(authResponse.user));
    
    if (environment.debug) {
      console.log('Session data saved to localStorage - user:', authResponse.user.username);
    }
  }

  /**
   * Clear session data
   */
  private clearSession(): void {
    this._token.set(null);
    this._user.set(null);
    
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    if (environment.debug) {
      console.log('Session data cleared from localStorage');
    }
  }

  /**
   * Get authorization header for HTTP requests
   */
  getAuthHeader(): { Authorization: string } | {} {
    const token = this._token();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
