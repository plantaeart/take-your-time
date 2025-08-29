import { Routes } from "@angular/router";
import { ProductsDisplayComponent } from "./components/products/products-display/products-display.component";
import { HomeComponent } from "./components/home/home/home.component";
import { AuthComponent } from "./components/auth/auth.component";
import { ProfileComponent } from "./components/profile/profile.component";
import { UserCartDetailComponent } from "./components/user/user-cart-detail/user-cart-detail.component";
import { UserWishlistDetailComponent } from "./components/user/user-wishlist-detail/user-wishlist-detail.component";
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
    path: "user-cart-detail",
    component: UserCartDetailComponent,
    canActivate: [AuthGuard], // Require authentication
  },
  {
    path: "user-wishlist-detail",
    component: UserWishlistDetailComponent,
    canActivate: [AuthGuard], // Require authentication
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
