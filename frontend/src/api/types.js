/**
 * API Response Types
 *
 * Standard response format for all API endpoints.
 * See /docs/API_RESPONSE_STANDARD.md for full documentation.
 */

/**
 * @typedef {Object} ApiSuccessResponse
 * @property {boolean} success - Always true for success responses
 * @property {*} data - The response payload
 */

/**
 * @typedef {Object} ApiErrorDetail
 * @property {string} code - Error code (e.g., 'VALIDATION_ERROR', 'HTTP_ERROR')
 * @property {string} message - Human-readable error message
 * @property {Object|Array} [details] - Optional additional error context
 */

/**
 * @typedef {Object} ApiErrorResponse
 * @property {boolean} success - Always false for error responses
 * @property {ApiErrorDetail} error - Error details
 */

/**
 * @typedef {Object} MappedApiError
 * @property {string} messageKey - i18n translation key for the error
 * @property {string} message - Raw error message from backend
 * @property {number} [status] - HTTP status code
 * @property {Object|Array} [details] - Optional validation details
 */

/**
 * @typedef {Object} TokenResponse
 * @property {string} access_token - JWT access token
 * @property {string} refresh_token - JWT refresh token
 * @property {string} token_type - Token type (always 'bearer')
 */

/**
 * @typedef {Object} UserResponse
 * @property {string} id - User UUID
 * @property {string} username - Username
 * @property {string} name - Full name
 * @property {number} age - User age
 * @property {'male'|'female'|'other'|'na'} gender - Gender
 * @property {string} phone - Phone number
 * @property {string|null} photo_url - Profile photo URL
 */

/**
 * @typedef {Object} AuthResponse
 * @property {UserResponse} user - User data
 * @property {TokenResponse} tokens - Auth tokens
 */

export {};
