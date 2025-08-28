import { environment } from '../../../environments/environment';

/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 * Uses Angular environment files for configuration
 */

export const API_CONFIG = {
  BASE_URL: environment.apiBaseUrl,
  ENDPOINTS: {
    PRODUCTS: '/api/products',
    AUTH: '/api/auth',
    CART: '/api/cart',
    WISHLIST: '/api/wishlist',
    ADMIN: '/api/admin'
  },
  TIMEOUT: environment.apiTimeout,
  RETRY_ATTEMPTS: 3
} as const;

// Environment-specific overrides
export const getApiBaseUrl = (): string => {
  return API_CONFIG.BASE_URL;
};
