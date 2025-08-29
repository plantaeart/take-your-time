/**
 * User models and interfaces for authentication and user management
 */

export interface User {
  id: number;
  username: string;
  firstname: string;
  email: string;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  schemaVersion: number;
}

export interface UserCreate {
  username: string;
  firstname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AuthError {
  detail: string;
}

/**
 * Password validation utility
 */
export class PasswordValidator {
  
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
  } {
    const errors: string[] = [];
    let score = 0;

    // Check minimum length
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least 1 uppercase letter');
    } else {
      score += 1;
    }

    // Check for special characters (at least 1)
    const specialChars = password.match(/[!@#$%^&*(),.?":{}|<>]/g);
    if (!specialChars || specialChars.length < 1) {
      errors.push('Password must contain at least 1 special character (!@#$%^&*(),.?":{}|<>)');
    } else {
      score += 1;
    }

    // Additional strength checks
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (score >= 5) strength = 'strong';
    else if (score >= 3) strength = 'medium';

    return {
      isValid: errors.length === 0,
      errors,
      strength
    };
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateConfirmPassword(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }
}
