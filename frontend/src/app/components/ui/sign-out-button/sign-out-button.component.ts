import { Component, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { useAuth } from '../../../hooks/auth.hooks';

@Component({
  selector: 'app-sign-out-button',
  standalone: true,
  imports: [ButtonModule, TooltipModule],
  templateUrl: './sign-out-button.component.html',
  styleUrl: './sign-out-button.component.css'
})
export class SignOutButtonComponent {
  // Input to control styling (admin gets filled background, user gets text style)
  isAdmin = input(false);
  
  // Use auth hook for sign-out functionality
  auth = useAuth();

  /**
   * Handle sign out button click
   */
  onSignOut(): void {
    this.auth.logout();
  }
}
