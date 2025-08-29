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
import { signal } from '@angular/core';
import { useAuth } from './hooks/auth.hooks';

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
  cartItemsCount = signal<number>(0); // Default to 0, will be updated by cart service later
  auth = useAuth();

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
  }

  /**
   * Check if current route is the auth page
   */
  isAuthRoute(): boolean {
    const route = this.currentRoute();
    return route === '/auth' || route.startsWith('/auth/');
  }

  /**
   * Logout user
   */
  logout(): void {
    this.auth.logout();
  }
}
