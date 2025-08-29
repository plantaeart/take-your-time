import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  canActivate(): boolean {
    const isAuthenticated = this.authStore.isAuthenticated();
    const isInitialized = this.authStore.isInitialized();
    
    // If not initialized yet, allow access to give time for localStorage restoration
    if (!isInitialized) {
      return true;
    }
    
    // If initialized but not authenticated, redirect to auth
    if (!isAuthenticated) {
      this.router.navigate(['/auth']);
      return false;
    }
    
    return true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  canActivate(): boolean {
    if (!this.authStore.isInitialized()) {
      return true;
    }

    const isAuthenticated = this.authStore.isAuthenticated();
    const isAdmin = this.authStore.isAdmin();
    
    if (!isAuthenticated) {
      this.router.navigate(['/auth']);
      return false;
    }
    
    if (!isAdmin) {
      this.router.navigate(['/home']);
      return false;
    }
    
    return true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  canActivate(): boolean {
    const isAuthenticated = this.authStore.isAuthenticated();
    const isInitialized = this.authStore.isInitialized();

    if (!isInitialized) {
      return true;
    }

    if (isAuthenticated) {
      this.router.navigate(['/home']);
      return false;
    }
    
    return true;
  }
}
