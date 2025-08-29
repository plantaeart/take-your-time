import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthStore } from '../stores/auth.store';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authStore = inject(AuthStore);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add auth token to requests
    const authHeader = this.authStore.getAuthHeader();
    
    const authReq = Object.keys(authHeader).length > 0 
      ? req.clone({ setHeaders: authHeader })
      : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 errors (unauthorized)
        if (error.status === 401) {
          this.authStore.handleSessionExpired();
        }
        return throwError(() => error);
      })
    );
  }
}
