/**
 * Centralized HTTP status codes for consistent API responses.
 * TypeScript equivalent of Python backend HTTP status enums.
 */

/**
 * HTTP status codes used throughout the application.
 * Matches backend app/models/enums/http_status.py
 */
export enum HTTPStatus {
  // 2xx Success Status Codes
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  
  // 4xx Client Error Status Codes
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  
  // 5xx Server Error Status Codes
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503
}

/**
 * Authentication-specific HTTP status codes.
 */
export enum AuthHTTPStatus {
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  TOKEN_EXPIRED = 401,
  INVALID_CREDENTIALS = 401
}

/**
 * Product-specific HTTP status codes.
 */
export enum ProductHTTPStatus {
  PRODUCT_NOT_FOUND = 404,
  PRODUCT_CREATED = 201,
  PRODUCT_UPDATED = 200,
  PRODUCT_DELETED = 200,
  INVALID_PRODUCT_DATA = 400,
  PRODUCT_CONFLICT = 409
}

/**
 * User-specific HTTP status codes.
 */
export enum UserHTTPStatus {
  USER_NOT_FOUND = 404,
  USER_CREATED = 201,
  USER_UPDATED = 200,
  USER_DELETED = 200,
  USER_DEACTIVATED = 200,
  USER_ACTIVATED = 200,
  INVALID_USER_DATA = 400,
  USER_CONFLICT = 409,
  CANNOT_MODIFY_SELF = 400
}

/**
 * Cart-specific HTTP status codes.
 */
export enum CartHTTPStatus {
  CART_ITEM_ADDED = 201,
  CART_ITEM_UPDATED = 200,
  CART_ITEM_REMOVED = 200,
  CART_CLEARED = 200,
  CART_NOT_FOUND = 404,
  ITEM_NOT_IN_CART = 404,
  INSUFFICIENT_STOCK = 400,
  INVALID_QUANTITY = 400
}

/**
 * Wishlist-specific HTTP status codes.
 */
export enum WishlistHTTPStatus {
  WISHLIST_ITEM_ADDED = 201,
  WISHLIST_ITEM_REMOVED = 200,
  WISHLIST_CLEARED = 200,
  WISHLIST_NOT_FOUND = 404,
  ITEM_NOT_IN_WISHLIST = 404,
  ITEM_ALREADY_IN_WISHLIST = 400
}

/**
 * Utility functions for easy access
 */

/**
 * Extract the integer status code from an enum value.
 */
export function getStatusCode(statusEnum: HTTPStatus | AuthHTTPStatus | ProductHTTPStatus | UserHTTPStatus | CartHTTPStatus | WishlistHTTPStatus): number {
  return statusEnum as number;
}

/**
 * Common status code combinations for quick access.
 */
export class CommonStatusCodes {
  // Success responses
  static readonly SUCCESS_OK = HTTPStatus.OK;
  static readonly SUCCESS_CREATED = HTTPStatus.CREATED;
  static readonly SUCCESS_NO_CONTENT = HTTPStatus.NO_CONTENT;
  
  // Error responses
  static readonly ERROR_BAD_REQUEST = HTTPStatus.BAD_REQUEST;
  static readonly ERROR_UNAUTHORIZED = HTTPStatus.UNAUTHORIZED;
  static readonly ERROR_FORBIDDEN = HTTPStatus.FORBIDDEN;
  static readonly ERROR_NOT_FOUND = HTTPStatus.NOT_FOUND;
  static readonly ERROR_CONFLICT = HTTPStatus.CONFLICT;
  static readonly ERROR_UNPROCESSABLE = HTTPStatus.UNPROCESSABLE_ENTITY;
  static readonly ERROR_INTERNAL = HTTPStatus.INTERNAL_SERVER_ERROR;
}

/**
 * Type guard to check if a status code indicates success (2xx)
 */
export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * Type guard to check if a status code indicates client error (4xx)
 */
export function isClientError(status: number): boolean {
  return status >= 400 && status < 500;
}

/**
 * Type guard to check if a status code indicates server error (5xx)
 */
export function isServerError(status: number): boolean {
  return status >= 500 && status < 600;
}
