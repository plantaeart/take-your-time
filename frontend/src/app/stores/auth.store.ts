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
  private tokenExpirationTimer: any = null;

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
        
        // Setup token expiration timer for existing token
        this.setupTokenExpirationTimer(storedToken);
        
        // Mark as initialized BEFORE validating to ensure interceptor works
        this._isInitialized.set(true);
        
        if (environment.debug) {
          console.log('Auth state restored from localStorage - user:', userData.username);
        }
        
        // Validate token in background with small delay to ensure interceptor is ready
        setTimeout(() => this.validateSession(), 100);
      } else {
        // Mark as initialized even if no stored auth
        this._isInitialized.set(true);
      }
    } catch (error) {
      console.error('Error initializing auth from storage:', error);
      this.clearSession();
      this._isInitialized.set(true);
    }
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
          console.log('Navigating to appropriate page...');
        }
        // Navigate to admin dashboard if user is admin, otherwise to home
        // This ensures admins go directly to their dashboard and don't hit user pages
        if (response.user.isAdmin) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/home']);
        }
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
      
      // Navigate to appropriate page based on user role
      if (response.user.isAdmin) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/home']);
      }
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
    
    // Setup automatic logout timer
    this.setupTokenExpirationTimer(authResponse.access_token);
    
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
    
    // Clear token expiration timer
    this.clearTokenExpirationTimer();
    
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

  /**
   * Decode JWT token payload
   */
  private decodeJwtPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      const payload = parts[1];
      // Add padding if needed
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      const decoded = atob(paddedPayload);
      return JSON.parse(decoded);
    } catch (error) {
      if (environment.debug) {
        console.error('Failed to decode JWT token:', error);
      }
      return null;
    }
  }

  /**
   * Get token expiration time in milliseconds
   */
  private getTokenExpirationTime(token: string): number | null {
    const payload = this.decodeJwtPayload(token);
    if (!payload || !payload.exp) {
      return null;
    }
    return payload.exp * 1000; // Convert to milliseconds
  }

  /**
   * Setup automatic logout timer based on token expiration
   */
  private setupTokenExpirationTimer(token: string): void {
    // Clear existing timer
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }

    const expirationTime = this.getTokenExpirationTime(token);
    if (!expirationTime) {
      if (environment.debug) {
        console.warn('Could not determine token expiration time');
      }
      return;
    }

    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;

    if (timeUntilExpiration <= 0) {
      // Token already expired
      this.handleSessionExpired();
      return;
    }

    if (environment.debug) {
      console.log(`Token expires in ${Math.round(timeUntilExpiration / 1000 / 60)} minutes`);
    }

    // Set timer to automatically logout when token expires
    this.tokenExpirationTimer = setTimeout(() => {
      if (environment.debug) {
        console.log('Token expired - logging out automatically');
      }
      this.handleSessionExpired();
    }, timeUntilExpiration);
  }

  /**
   * Clear token expiration timer
   */
  private clearTokenExpirationTimer(): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }
}
