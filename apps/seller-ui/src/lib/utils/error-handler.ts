/**
 * Secure error message handler that prevents sensitive information leakage
 * while providing meaningful feedback to users
 */

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string | string[];
      error?: string;
    };
  };
  message?: string;
}

// Safe error messages that can be shown to users
const SAFE_ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Invalid credentials. Please check your email and password.',
  403: 'Access denied. You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This email is already registered. Please use a different email or try logging in.',
  422: 'Invalid input data. Please check your information and try again.',
  429: 'Too many requests. Please wait a moment before trying again.',
  500: 'Something went wrong on our end. Please try again later.',
  502: 'Service temporarily unavailable. Please try again later.',
  503: 'Service temporarily unavailable. Please try again later.',
  504: 'Request timeout. Please try again later.',
};

// Validation error patterns that are safe to show
const SAFE_VALIDATION_PATTERNS = [
  /password must be at least \d+ characters/i,
  /password must contain.*uppercase/i,
  /password must contain.*lowercase/i,
  /password must contain.*number/i,
  /password must contain.*special character/i,
  /email must be a valid email/i,
  /otp must be \d+ characters/i,
  /name is required/i,
  /email is required/i,
  /password is required/i,
  /passwords do not match/i,
  /otp is required/i,
  /must accept.*terms/i,
];

/**
 * Extracts a safe, user-friendly error message from an API error
 */
export function extractSafeErrorMessage(error: ApiError): string {
  // Handle network errors
  if (!error.response) {
    return 'Network error. Please check your connection and try again.';
  }

  const { status, data } = error.response;
  const backendMessage = Array.isArray(data?.message)
    ? data.message[0]
    : data?.message;

  // Check if backend message is a safe validation message
  if (typeof backendMessage === 'string') {
    const isSafeValidationMessage = SAFE_VALIDATION_PATTERNS.some(pattern =>
      pattern.test(backendMessage)
    );

    if (isSafeValidationMessage) {
      return backendMessage;
    }

    // Handle specific known safe messages
    if (backendMessage.includes('OTP') || backendMessage.includes('verification')) {
      return backendMessage;
    }

    if (backendMessage.includes('already exists')) {
      return 'This email is already registered. Please use a different email or try logging in.';
    }
  }

  // Use safe message based on status code
  if (status && SAFE_ERROR_MESSAGES[status]) {
    return SAFE_ERROR_MESSAGES[status];
  }

  // Default fallback
  return 'Something went wrong. Please try again later.';
}

/**
 * Determines if an error is a client error (4xx) that the user can potentially fix
 */
export function isClientError(error: ApiError): boolean {
  const status = error.response?.status;
  return status ? status >= 400 && status < 500 : false;
}

/**
 * Determines if an error is a server error (5xx) that is likely temporary
 */
export function isServerError(error: ApiError): boolean {
  const status = error.response?.status;
  return status ? status >= 500 : false;
}