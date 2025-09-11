'use client';

import React from 'react';
import GoogleIcon from '../../assets/svgs/google-icon';

export const GoogleLoginButton = () => {
  return (
    <a
      href="http://localhost:8080/api/v1/auth/login/google"
      className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-text-primary bg-brand-primary-50 border rounded-md shadow-sm border-ui-divider hover:bg-ui-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
    >
      <GoogleIcon />
      <span className="ml-3">Sign in with Google</span>
    </a>
  );
};
