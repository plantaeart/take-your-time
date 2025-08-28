import { Routes } from "@angular/router";
import { HomeComponent } from "./shared/features/home/home.component";
import { ProductsDisplayComponent } from "./components/products-display/products-display.component";

export const APP_ROUTES: Routes = [
  {
    path: "home",
    component: HomeComponent,
  },
  {
    path: "products/list",
    component: ProductsDisplayComponent,
  },
  { path: "", redirectTo: "home", pathMatch: "full" },
];
