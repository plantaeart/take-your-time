import {
  Component,
} from "@angular/core";
import { Router, RouterModule, NavigationEnd } from "@angular/router";
import { SplitterModule } from 'primeng/splitter';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { PanelMenuComponent } from "./components/ui/panel-menu/panel-menu.component";
import { filter, map } from 'rxjs/operators';
import { signal, effect } from '@angular/core';
import { useAuth } from './hooks/auth.hooks';
import { useCart } from './hooks/cart.hooks';
import { environment } from '../environments/environment';

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  standalone: true,
  imports: [RouterModule, SplitterModule, ToolbarModule, ButtonModule, BadgeModule, ToastModule, PanelMenuComponent],
})
export class AppComponent {
  title = "ALTEN SHOP";
  
  private currentRoute = signal<string>('');
  auth = useAuth();
  cart = useCart();

  constructor(private router: Router) {
    // Track current route
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(event => (event as NavigationEnd).url)
      )
      .subscribe(url => {
        this.currentRoute.set(url);
      });

    // Simple cart management - only reset cart on logout
    effect(() => {
      const isAuthenticated = this.auth.isAuthenticated();
      const isAuthInitialized = this.auth.isInitialized();
      
      if (isAuthInitialized && !isAuthenticated) {
        // User is logged out - reset cart
        this.cart.resetCart();
      }
      // Note: Cart will be loaded manually when user navigates to cart or adds items
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    // Simple initialization - no automatic cart loading
  }

  /**
   * Check if current route is the auth page
   */
  isAuthRoute(): boolean {
    const route = this.currentRoute();
    return route === '/auth' || route.startsWith('/auth/');
  }

  /**
   * Navigate to cart page
   */
  async goToCart(): Promise<void> {
    // Load cart when user explicitly navigates to cart
    if (this.auth.isAuthenticated()) {
      await this.cart.loadCart();
    }
    this.router.navigate(['/user-cart-detail']);
  }

  /**
   * Logout user
   */
  logout(): void {
    this.auth.logout();
  }
}
