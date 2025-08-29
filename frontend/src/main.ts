import { enableProdMode, importProvidersFrom, APP_INITIALIZER } from "@angular/core";

import { registerLocaleData } from "@angular/common";
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from "@angular/common/http";
import localeFr from "@angular/common/locales/fr";
import { BrowserModule, bootstrapApplication } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideRouter } from "@angular/router";
import { APP_ROUTES } from "app/app.routes";
import { ConfirmationService, MessageService } from "primeng/api";
import { DialogService } from "primeng/dynamicdialog";
import { AppComponent } from "./app/app.component";
import { environment } from "./environments/environment";
import { AuthInterceptor } from "./app/interceptors/auth.interceptor";
import { AuthStore } from "./app/stores/auth.store";

function initializeApp(authStore: AuthStore) {
  return (): Promise<boolean> => {
    return new Promise((resolve) => {
      // Give the auth store a moment to initialize from localStorage
      setTimeout(() => {
        if (environment.debug) {
          console.log('App initialization complete - auth initialized:', authStore.isInitialized());
        }
        resolve(true);
      }, 50);
    });
  };
}

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule),
    provideHttpClient(
      withInterceptorsFromDi(),
    ),
    provideAnimations(),
    provideRouter(APP_ROUTES),
    ConfirmationService,
    MessageService,
    DialogService,
    // HTTP Interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    // App Initialization
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthStore],
      multi: true,
    },
  ],
}).catch((err) => console.log(err));

registerLocaleData(localeFr, "fr-FR");
