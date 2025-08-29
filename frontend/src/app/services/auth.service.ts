import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponse, UserLogin, UserCreate, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Login user with email and password
   */
  login(credentials: UserLogin): Observable<AuthResponse> {
    const loginData = {
      email: credentials.email,
      password: credentials.password
    };

    return this.http.post<{access_token: string, token_type: string}>(`${this.apiUrl}/api/login`, loginData)
      .pipe(
        switchMap((tokenResponse: {access_token: string, token_type: string}) => {
          // Set token temporarily for the user request
          const headers = { Authorization: `Bearer ${tokenResponse.access_token}` };
          
          // Get user data using the token
          return this.http.get<User>(`${this.apiUrl}/api/users/me`, { headers })
            .pipe(
              map((user: User) => ({
                access_token: tokenResponse.access_token,
                token_type: tokenResponse.token_type,
                user: user
              }))
            );
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Register new user
   */
  register(userData: UserCreate): Observable<AuthResponse> {
    const { confirmPassword, ...userCreateData } = userData;
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/account`, userCreateData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Logout user (add token to blacklist)
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/logout`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/users/me`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Check if token is valid
   */
  validateToken(): Observable<boolean> {
    return this.http.get<User>(`${this.apiUrl}/api/users/me`)
      .pipe(
        map(() => true), // If we get user data, token is valid
        catchError(() => throwError(() => new Error('Token validation failed')))
      );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error?.detail) {
      errorMessage = error.error.detail;
    } else if (error.status === 0) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.status === 401) {
      errorMessage = 'Invalid credentials';
    } else if (error.status === 422) {
      errorMessage = 'Invalid data provided';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    return throwError(() => new Error(errorMessage));
  }
}
