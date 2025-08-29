import { Routes } from "@angular/router";
import { ProductsDisplayComponent } from "./components/products/products-display/products-display.component";
import { HomeComponent } from "./components/home/home/home.component";

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
