import { Component, effect, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MessageModule } from 'primeng/message';
import { MessagesModule } from 'primeng/messages';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { useContact } from '../../../hooks/contact.hooks';
import { useAuth } from '../../../hooks/auth.hooks';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputTextareaModule,
    MessageModule,
    MessagesModule,
    ProgressSpinnerModule,
    ToastModule
  ],
  templateUrl: './contact-form.component.html',
  styleUrl: './contact-form.component.css'
})
export class ContactFormComponent {
  contactForm: FormGroup;
  
  // Use contact hook for state management
  private contact = useContact();
  
  // Use auth hook for user information
  private auth = useAuth();
  
  // Expose contact state as readonly signals
  isSubmitting = this.contact.isSubmitting;
  error = this.contact.error;
  isSuccess = this.contact.isSuccess;
  lastResponse = this.contact.lastResponse;

  constructor(
    private formBuilder: FormBuilder,
    private messageService: MessageService
  ) {
    this.contactForm = this.createContactForm();
    this.setupEffects();
  }

  private createContactForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(300)]]
    });
  }

  private setupEffects(): void {
    // Effect to handle success state
    effect(() => {
      if (this.isSuccess()) {
        const response = this.lastResponse();
        
        // Show success toast
        this.messageService.add({
          severity: 'success',
          summary: 'Message Sent!',
          detail: response?.message || 'Your message has been sent successfully!',
          life: 5000
        });
        
        // Clear only the message field on success, keep email
        const currentEmail = this.contactForm.get('email')?.value;
        this.contactForm.reset();
        this.contactForm.patchValue({ email: currentEmail });
        
        // Clear response after showing toast
        setTimeout(() => {
          this.contact.clearResponse();
        }, 1000);
      }
    });

    // Effect to handle error state
    effect(() => {
      const errorMessage = this.error();
      if (errorMessage) {
        // Show error toast
        this.messageService.add({
          severity: 'error',
          summary: 'Message Failed',
          detail: errorMessage,
          life: 7000
        });
      }
    });

    // Effect to auto-fill email when user is authenticated
    effect(() => {
      const currentUser = this.auth.user();
      if (currentUser?.email && this.contactForm) {
        const currentEmail = this.contactForm.get('email')?.value;
        
        // Only auto-fill if email field is empty
        if (!currentEmail) {
          this.contactForm.patchValue({ email: currentUser.email });
        }
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.contactForm.valid && !this.isSubmitting()) {
      const contactData = this.contactForm.value;
      await this.contact.sendMessage(contactData);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.contactForm.get(fieldName);
    
    if (field?.touched && field?.errors) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required.`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address.';
      }
      if (field.errors['minlength']) {
        return `Message must be at least ${field.errors['minlength'].requiredLength} characters long.`;
      }
      if (field.errors['maxlength']) {
        return `Message cannot exceed ${field.errors['maxlength'].requiredLength} characters.`;
      }
    }
    
    return null;
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: Record<string, string> = {
      email: 'Email',
      message: 'Message'
    };
    return displayNames[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field?.touched && field?.errors);
  }
}
