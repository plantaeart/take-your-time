import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { SignOutButtonComponent } from '../../ui/sign-out-button/sign-out-button.component';
import { useAuth } from '../../../hooks/auth.hooks';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TabViewModule,
    SignOutButtonComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  // Use auth hook to get admin user info
  auth = useAuth();

  ngOnInit(): void {
    // Component initialization
  }

  /**
   * Get admin email for display
   */
  get adminEmail(): string {
    return this.auth.user()?.email || 'Admin';
  }
}
