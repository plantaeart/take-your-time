import { Routes } from "@angular/router";
import { ProductsDisplayComponent } from "./components/products/products-display/products-display.component";
import { HomeComponent } from "./components/home/home/home.component";
import { AuthComponent } from "./components/auth/auth.component";
import { ProfileComponent } from "./components/profile/profile.component";
import { AuthGuard, GuestGuard } from "./guards/auth.guard";

export const APP_ROUTES: Routes = [
  {
    path: "auth",
    component: AuthComponent,
    canActivate: [GuestGuard], // Only allow access if not authenticated
  },
  {
    path: "home",
    component: HomeComponent,
    canActivate: [AuthGuard], // Require authentication
  },
  {
    path: "profile",
    component: ProfileComponent,
    canActivate: [AuthGuard], // Require authentication
  },
  {
    path: "products/list",
    component: ProductsDisplayComponent,
    canActivate: [AuthGuard], // Require authentication
  },
  {
    path: "products",
    redirectTo: "products/list",
    pathMatch: "full"
  },
  { 
    path: "", 
    redirectTo: "home", 
    pathMatch: "full" 
  },
  {
    path: "**",
    redirectTo: "home" // Redirect unknown routes to home (will redirect to auth if not authenticated)
  }
];
