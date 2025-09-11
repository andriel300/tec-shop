const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

interface LoginUserValues {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

// Helper function to call the login API
export async function loginUser(values: LoginUserValues) {
  const res = await fetch(`${API_BASE_URL}/auth/login/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
    credentials: 'include',
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.message || 'Login failed. Please check your credentials.'
    );
  }

  return res.json();
}

interface GenerateOtpValues {
  email: string;
}

// API helper to request an OTP
export async function generateOtp(values: GenerateOtpValues) {
  const res = await fetch(`${API_BASE_URL}/auth/otp/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to send OTP.');
  }
  return res.json();
}

interface VerifyOtpValues {
  email: string;
  otp: string;
}

// API helper to verify the OTP and log in
export async function verifyOtp(values: VerifyOtpValues) {
  const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Invalid OTP.');
  }
  return res.json();
}

interface RegisterUserValues {
  name: string;
  email: string;
  password?: string;
}

// Helper function to call the register API
export async function registerUser(values: RegisterUserValues) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
    credentials: 'include',
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.message || 'Registration failed. Please try again.'
    );
  }

  return res.json();
}

interface VerifyEmailValues {
  name: string;
  email: string;
  otp: string;
  password?: string;
}

// API helper to verify the email and create user
export async function verifyEmail(values: VerifyEmailValues) {
  const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
    credentials: 'include',
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Invalid OTP.');
  }

  return res.json();
}
