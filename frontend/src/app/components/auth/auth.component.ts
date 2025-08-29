import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterModule } from '@angular/router';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageModule } from 'primeng/message';
import { MessagesModule } from 'primeng/messages';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Application imports
import { useAuth } from '../../hooks/auth.hooks';
import { PasswordValidator } from '../../models/user.model';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    TabViewModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    FloatLabelModule,
    MessageModule,
    MessagesModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  // Auth hook
  private auth = useAuth();

  // Form groups
  loginForm: FormGroup;
  registerForm: FormGroup;

  // UI state
  activeTab = signal(0);
  isLogin = computed(() => this.activeTab() === 0);

  // Password strength tracking
  passwordStrength = signal<'weak' | 'medium' | 'strong'>('weak');
  passwordErrors = signal<string[]>([]);

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.loginForm = this.createLoginForm();
    this.registerForm = this.createRegisterForm();
  }

  // Computed properties for template
  isLoading = this.auth.isLoading;

  /**
   * Create login form with validation
   */
  private createLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  /**
   * Create register form with validation
   */
  private createRegisterForm(): FormGroup {
    return this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      firstname: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, this.passwordValidator.bind(this)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Custom password validator
   */
  private passwordValidator(control: AbstractControl): {[key: string]: any} | null {
    if (!control.value) {
      return null;
    }

    const validation = PasswordValidator.validatePassword(control.value);
    this.passwordStrength.set(validation.strength);
    this.passwordErrors.set(validation.errors);

    return validation.isValid ? null : { passwordStrength: validation.errors };
  }

  /**
   * Password match validator
   */
  private passwordMatchValidator(group: AbstractControl): {[key: string]: any} | null {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  /**
   * Handle login form submission
   */
  async onLogin(): Promise<void> {
    if (this.loginForm.valid) {
      const formValue = this.loginForm.value;
      await this.auth.login({
        email: formValue.email,
        password: formValue.password
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  /**
   * Handle register form submission
   */
  async onRegister(): Promise<void> {
    if (this.registerForm.valid) {
      const formValue = this.registerForm.value;
      const success = await this.auth.registerOnly({
        username: formValue.username,
        firstname: formValue.firstname,
        email: formValue.email,
        password: formValue.password,
        confirmPassword: formValue.confirmPassword
      });
      
      // If registration successful, switch to login tab
      if (success) {
        this.activeTab.set(0); // Switch to login tab (index 0)
        this.registerForm.reset();
        this.passwordStrength.set('weak');
        this.passwordErrors.set([]);
        
        // Pre-fill email in login form for convenience
        this.loginForm.patchValue({
          email: formValue.email
        });
      }
    } else {
      this.markFormGroupTouched(this.registerForm);
    }
  }

  /**
   * Handle tab change
   */
  onTabChange(event: any): void {
    this.activeTab.set(event.index);
    // Reset forms when switching tabs
    this.loginForm.reset();
    this.registerForm.reset();
    this.passwordStrength.set('weak');
    this.passwordErrors.set([]);
  }

  /**
   * Mark all form controls as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get field error message
   */
  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `${fieldName} must be no more than ${field.errors['maxlength'].requiredLength} characters`;
      if (field.errors['passwordStrength']) return 'Password does not meet requirements';
    }
    return '';
  }

  /**
   * Get password mismatch error
   */
  getPasswordMismatchError(): string {
    const form = this.registerForm;
    if (form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched) {
      return 'Passwords do not match';
    }
    return '';
  }

  /**
   * Get password strength class for styling
   */
  getPasswordStrengthClass(): string {
    switch (this.passwordStrength()) {
      case 'strong': return 'password-strong';
      case 'medium': return 'password-medium';
      default: return 'password-weak';
    }
  }
}
