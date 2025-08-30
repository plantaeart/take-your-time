import { Routes } from "@angular/router";
import { ProductsDisplayComponent } from "./components/products/products-display/products-display.component";
import { HomeComponent } from "./components/home/home/home.component";
import { AuthComponent } from "./components/auth/auth.component";
import { ProfileComponent } from "./components/profile/profile.component";
import { UserCartDetailComponent } from "./components/user/user-cart-detail/user-cart-detail.component";
import { UserWishlistDetailComponent } from "./components/user/user-wishlist-detail/user-wishlist-detail.component";
import { ContactFormComponent } from "./components/contact/contact-form/contact-form.component";
import { AdminDashboardComponent } from "./components/admin/admin-dashboard/admin-dashboard.component";
import { AuthGuard, GuestGuard, AdminGuard, UserGuard } from "./guards/auth.guard";

export const APP_ROUTES: Routes = [
  {
    path: "auth",
    component: AuthComponent,
    canActivate: [GuestGuard], // Only allow access if not authenticated
  },
  {
    path: "home",
    component: HomeComponent,
    canActivate: [UserGuard], // Prevent admin access, redirect to admin dashboard
  },
  {
    path: "profile",
    component: ProfileComponent,
    canActivate: [UserGuard], // Prevent admin access, redirect to admin dashboard
  },
  {
    path: "products/list",
    component: ProductsDisplayComponent,
    canActivate: [UserGuard], // Prevent admin access, redirect to admin dashboard
  },
  {
    path: "products",
    redirectTo: "products/list",
    pathMatch: "full"
  },
  {
    path: "user-cart-detail",
    component: UserCartDetailComponent,
    canActivate: [UserGuard], // Prevent admin access, redirect to admin dashboard
  },
  {
    path: "user-wishlist-detail",
    component: UserWishlistDetailComponent,
    canActivate: [UserGuard], // Prevent admin access, redirect to admin dashboard
  },
  {
    path: "contact",
    component: ContactFormComponent,
    canActivate: [UserGuard], // Prevent admin access, redirect to admin dashboard
  },
  {
    path: "admin",
    component: AdminDashboardComponent,
    canActivate: [AdminGuard], // Require admin privileges
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
