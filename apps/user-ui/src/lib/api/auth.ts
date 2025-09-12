export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api';

interface LoginUserValues {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

// Helper function to extract error message from API response
function getErrorMessage(errorData: any): string {
  // Handle nested message object from api-gateway
  if (errorData && typeof errorData.message === 'object' && errorData.message !== null) {
    return getErrorMessage(errorData.message);
  }

  // Handle different error response formats
  if (typeof errorData === 'string') {
    return errorData;
  }

  if (errorData && typeof errorData === 'object') {
    // Try different common error message fields
    if (errorData.message) {
      if (Array.isArray(errorData.message)) {
        return errorData.message.join(', ');
      }
      if (typeof errorData.message === 'string') {
        return errorData.message;
      }
    }

    // Try other common error fields
    if (errorData.error && typeof errorData.error === 'string') {
      return errorData.error;
    }

    if (errorData.detail && typeof errorData.detail === 'string') {
      return errorData.detail;
    }

    // If we have errors array (common in validation responses)
    if (errorData.errors && Array.isArray(errorData.errors)) {
      return errorData.errors
        .map((err: any) =>
          typeof err === 'string'
            ? err
            : err.message || err.msg || 'Unknown error'
        )
        .join(', ');
    }
  }

  return 'An unexpected error occurred';
}

// Helper function to call the login API
export async function loginUser(values: LoginUserValues) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
      credentials: 'include',
    });

    if (!res.ok) {
      let errorData;
      let message = 'Login failed. Please check your credentials.';

      try {
        // Try to parse JSON error response
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await res.json();
          message = getErrorMessage(errorData);
        } else {
          // Handle non-JSON error responses
          const textResponse = await res.text();
          message = textResponse || `HTTP ${res.status}: ${res.statusText}`;
        }
      } catch (parseError) {
        // If we can't parse the error response, use status-based message
        console.error('Error parsing error response:', parseError);
        if (res.status === 401) {
          message =
            'Invalid credentials. Please check your email and password.';
        } else if (res.status === 400) {
          message = 'Invalid request. Please check your input.';
        } else if (res.status >= 500) {
          message = 'Server error. Please try again later.';
        } else {
          message = `Request failed with status ${res.status}`;
        }
      }

      console.error('Login API Error:', {
        status: res.status,
        statusText: res.statusText,
        errorData,
        message,
      });

      throw new Error(message);
    }

    return res.json();
  } catch (error) {
    // Handle network errors or other fetch errors
    if (error instanceof Error) {
      throw error; // Re-throw our custom errors
    }

    console.error('Network or fetch error:', error);
    throw new Error(
      'Network error. Please check your connection and try again.'
    );
  }
}

interface GenerateOtpValues {
  email: string;
}

// API helper to request an OTP
export async function generateOtp(values: GenerateOtpValues) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/otp/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
      credentials: 'include',
    });

    if (!res.ok) {
      let errorData;
      let message = 'Failed to send OTP.';

      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await res.json();
          message = getErrorMessage(errorData);
        } else {
          const textResponse = await res.text();
          message = textResponse || `HTTP ${res.status}: ${res.statusText}`;
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
        message = `Request failed with status ${res.status}`;
      }

      throw new Error(message);
    }

    return res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'Network error. Please check your connection and try again.'
    );
  }
}

interface VerifyOtpValues {
  email: string;
  otp: string;
}

// API helper to verify the OTP and log in
export async function verifyOtp(values: VerifyOtpValues) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
      credentials: 'include',
    });

    if (!res.ok) {
      let errorData;
      let message = 'Invalid OTP.';

      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await res.json();
          message = getErrorMessage(errorData);
        } else {
          const textResponse = await res.text();
          message = textResponse || `HTTP ${res.status}: ${res.statusText}`;
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
        message = `Request failed with status ${res.status}`;
      }

      throw new Error(message);
    }

    return res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'Network error. Please check your connection and try again.'
    );
  }
}

interface SignupUserValues {
  name: string;
  email: string;
  password?: string;
}

// Helper function to call the signup API
export async function signupUser(values: SignupUserValues) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
      credentials: 'include',
    });

    if (!res.ok) {
      let errorData;
      let message = 'Registration failed. Please try again.';

      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await res.json();
          message = getErrorMessage(errorData);
        } else {
          const textResponse = await res.text();
          message = textResponse || `HTTP ${res.status}: ${res.statusText}`;
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
        message = `Request failed with status ${res.status}`;
      }

      throw new Error(message);
    }

    return res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'Network error. Please check your connection and try again.'
    );
  }
}

interface VerifyEmailValues {
  name: string;
  email: string;
  otp: string;
  password?: string;
}

// API helper to verify the email and create user
export async function verifyEmail(values: VerifyEmailValues) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
      credentials: 'include',
    });

    if (!res.ok) {
      let errorData;
      let message = 'Invalid OTP.';

      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await res.json();
          message = getErrorMessage(errorData);
        } else {
          const textResponse = await res.text();
          message = textResponse || `HTTP ${res.status}: ${res.statusText}`;
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
        message = `Request failed with status ${res.status}`;
      }

      throw new Error(message);
    }

    return res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'Network error. Please check your connection and try again.'
    );
  }
}
