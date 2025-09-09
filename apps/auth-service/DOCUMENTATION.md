# Tec-Shop Auth Service Documentation

This document provides instructions and guidelines for understanding and working with the `auth-service`.

## Overview

The `auth-service` is a core component of the Tec-Shop application, responsible for handling all aspects of user authentication and authorization. Its key features include:

- User registration with email verification (via OTP)
- Email and password login
- Google OAuth 2.0 integration
- Secure session management using JWT (Access and Refresh Tokens)
- One-Time Password (OTP) generation and verification for various actions
- Password reset functionality
- Role-based access control (RBAC) foundations

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- A running PostgreSQL database
- [Docker](https://www.docker.com/) (optional, for running a local database)

### Installation

1.  Navigate to the project root.
2.  Install all dependencies:
    ```bash
    npm install
    ```

### Database Setup

The service uses Prisma for database management.

1.  **Ensure your PostgreSQL database is running.**
2.  **Set your `DATABASE_URL`** in the `.env` file (see Environment Variables section).
3.  **Apply the schema** to your database. Run the following command from the project root:

    ```bash
    npx nx run auth-service:prisma-migrate
    ```

    _Note: This command is a placeholder. You may need to configure it in `nx.json` or run `npx prisma migrate dev --schema=apps/auth-service/prisma/schema.prisma` from the root._

### Running the Service

To run the `auth-service` in development mode with hot-reloading, use the following command from the project root:

```bash
nx serve auth-service
```

The service will start on the port defined by the `PORT` environment variable (defaults to `6001`).

### Testing

To run the test suite for the `auth-service`, execute the following command from the project root:

```bash
nx test auth-service
```

## Environment Variables

Create a `.env` file in the root of the `apps/auth-service` directory. This file is not committed to version control.

```env
# The port the service will run on.
PORT=6001

# The connection string for the PostgreSQL database.
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="postgresql://admin:123456@localhost:5432/tec-shop-auth"

# Secret keys for signing JWTs. These should be long, random strings.
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-key"

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Service Configuration (using Mailgun as an example)
MAILGUN_API_KEY="your-mailgun-api-key"
MAILGUN_DOMAIN="your-mailgun-domain"
MAILGUN_FROM_EMAIL="noreply@yourdomain.com"

# The base URL of the frontend application, used for generating links in emails.
CLIENT_URL="http://localhost:3000"
```

## API Endpoints

All endpoints are prefixed with `/auth`.

### User Registration & Verification

- **`POST /register`**: Initiates the registration process for a new user. Sends an OTP to the provided email.

  - **Payload Example** (`RegisterUserDto`):
    ```json
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "password": "Str0ngP@ssw0rd!"
    }
    ```

- **`POST /verify-email`**: Verifies the user's email using the OTP and creates the user account.
  - **Payload Example** (`VerifyEmailDto`):
    ```json
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "otp": "123456",
      "password": "Str0ngP@ssw0rd!"
    }
    ```

### Authentication

- **`POST /login/email`**: Logs a user in with their email and password. Sets `access_token` and `refresh_token` cookies.

  - **Payload Example** (`LoginDto`):
    ```json
    {
      "email": "john.doe@example.com",
      "password": "Str0ngP@ssw0rd!"
    }
    ```

- **`POST /refresh`**: Provides a new `access_token` and `refresh_token` using a valid refresh token.

  - **Payload Example** (`RefreshTokenDto`):
    ```json
    {
      "refreshToken": "your-valid-refresh-token"
    }
    ```

- **`POST /logout`**: Logs the user out and clears authentication cookies.

  - **Requires**: `access_token`

- **`GET /me`**: Retrieves the profile of the currently authenticated user.
  - **Requires**: `access_token`

### Google OAuth

- **`GET /login/google`**: Initiates the Google OAuth2 login flow, redirecting the user to Google.
- **`GET /google/callback`**: The callback URL that Google redirects to after authentication. Handles user creation/login.

### One-Time Password (OTP)

- **`POST /otp/generate`**: Generates and sends a new OTP to a user's email.

  - **Payload Example** (`GenerateOtpDto`):
    ```json
    {
      "email": "john.doe@example.com"
    }
    ```

- **`POST /otp/verify`**: Verifies an OTP for a specific action.
  - **Payload Example** (`VerifyOtpDto`):
    ```json
    {
      "email": "john.doe@example.com",
      "otp": "123456"
    }
    ```

### Password Reset

- **`POST /password/request-reset`**: Sends a password reset link to the user's email.

  - **Payload Example** (`RequestPasswordResetDto`):
    ```json
    {
      "email": "john.doe@example.com"
    }
    ```

- **`POST /password/reset`**: Resets the user's password using the token from the reset link.
  - **Payload Example** (`ResetPasswordDto`):
    ```json
    {
      "email": "john.doe@example.com",
      "token": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
      "newPassword": "NewSecurePassword123"
    }
    ```

### Role-Based Access

- **`GET /admin-only`**: An example endpoint protected by a role guard, accessible only by users with the 'admin' role.
  - **Requires**: `access_token` with 'admin' role.

## Key Concepts

### JWT Strategy

The service uses a JWT-based strategy for securing endpoints. An `access_token` with a short lifespan (15 minutes) is used to authenticate requests. A `refresh_token` with a longer lifespan (7 days) is used to obtain a new pair of tokens without requiring the user to log in again.

### Guards

- **`JwtAuthGuard`**: Protects routes by verifying the `access_token` in the request.
- **`RolesGuard`**: Protects routes based on user roles, used in conjunction with the `@Roles()` decorator.
- **`AuthGuard('google')`**: An official Passport.js guard used to orchestrate the Google OAuth flow.

### Database

The service uses Prisma as its ORM to interact with the PostgreSQL database. The schema is defined in `apps/auth-service/prisma/schema.prisma`. To apply changes to your database, run the migration command specified in the Database Setup section.
