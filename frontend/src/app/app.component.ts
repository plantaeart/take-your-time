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
import { useWishlist } from './hooks/wishlist.hooks';
import { AppInitializationService } from './services/app-initialization.service';
import { SignOutButtonComponent } from './components/ui/sign-out-button/sign-out-button.component';
import { environment } from '../environments/environment';

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  standalone: true,
  imports: [RouterModule, SplitterModule, ToolbarModule, ButtonModule, BadgeModule, ToastModule, PanelMenuComponent, SignOutButtonComponent],
})
export class AppComponent {
  title = "TAKE YOUR TIME";
  
  private currentRoute = signal<string>('');
  auth = useAuth();
  cart = useCart();
  wishlist = useWishlist();

  constructor(
    private router: Router,
    private appInitService: AppInitializationService // This will automatically handle auth-cart coordination
  ) {
    // Track current route
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(event => (event as NavigationEnd).url)
      )
      .subscribe(url => {
        this.currentRoute.set(url);
      });

    // The AppInitializationService now handles cart initialization via effects
    // This removes the circular dependency issue
  }

  ngOnInit() {
    // Simple initialization - no automatic cart loading
  }

  /**
   * Check if current route is the auth page or admin dashboard
   */
  isAuthRoute(): boolean {
    const route = this.currentRoute();
    return route === '/auth' || route.startsWith('/auth/') || route === '/admin' || route.startsWith('/admin/');
  }

  /**
   * Navigate to cart page
   */
  goToCart(): void {
    // Simply navigate to cart page - let the cart component handle loading
    this.router.navigate(['/user-cart-detail']);
  }

  /**
   * Navigate to wishlist page
   */
  goToWishlist(): void {
    this.router.navigate(['/user-wishlist-detail']);
  }
}
