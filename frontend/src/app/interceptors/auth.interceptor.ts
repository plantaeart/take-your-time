import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthStore } from '../stores/auth.store';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authStore = inject(AuthStore);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add auth token to requests - but only if auth store is initialized
    let authReq = req;
    
    try {
      const authHeader = this.authStore.getAuthHeader();
      if (Object.keys(authHeader).length > 0) {
        authReq = req.clone({ setHeaders: authHeader });
      }
    } catch (error) {
      // If auth store is not ready, proceed without auth header
      console.warn('Auth store not ready during request, proceeding without auth header');
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 errors (unauthorized) - but only if auth store is ready
        if (error.status === 401) {
          try {
            this.authStore.handleSessionExpired();
          } catch (authError) {
            console.warn('Auth store not ready during error handling');
          }
        }
        return throwError(() => error);
      })
    );
  }
}
