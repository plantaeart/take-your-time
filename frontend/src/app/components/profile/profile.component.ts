import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { useAuthState } from '../../hooks/auth.hooks';
import { TopPageComponent } from '../ui/top-page/top-page.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TopPageComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  private authState = useAuthState();

  // Expose auth state to template
  user = this.authState.user;
}
