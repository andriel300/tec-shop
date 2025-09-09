# Tec-Shop: A Multi-Vendor Microservice E-commerce Platform

This repository contains the source code for Tec-Shop, a full-stack, multi-vendor e-commerce platform built with a modern microservices architecture. It features a Next.js frontend, a NestJS backend, and is managed as an Nx monorepo.

## Overview

Tec-Shop is a cutting-edge e-commerce platform designed for scalability, maintainability, and a rich developer experience. The project leverages the power of NestJS for the backend microservices and Next.js for a dynamic, server-rendered frontend. It is structured as a monorepo to streamline development, code sharing, and dependency management across the different applications.

## Problems Solved & Best Practices Demonstrated

This project tackles common challenges in modern application development, showcasing elegant solutions:

- **Secure and Scalable Authentication:** Implemented a robust, custom authentication system using JWTs (Access and Refresh Tokens) and secure cookies. This provides a stateless, scalable, and secure foundation for user identity management.
- **Enhanced Security with OTP:** Integrated a One-Time Password (OTP) system for email verification and potentially passwordless login flows. This significantly improves user security and provides a modern user experience.
- **Efficient Temporary Data Handling:** Utilized **Redis** as a high-performance, in-memory data store for short-lived data like OTPs, ensuring rapid, time-sensitive operations.
- **Type-Safe Database Operations:** Leveraged **Prisma** as a next-generation ORM for PostgreSQL, providing full type-safety between the database and the application, which eliminates a whole class of runtime errors.
- **Monorepo Management:** Employed **Nx** to manage multiple applications and shared libraries within a single repository. This solves challenges related to code sharing, consistent tooling, and simplified dependency management in a microservices environment.
- **Automated API Documentation:** Configured **Swagger** for automatic generation of interactive API documentation. This keeps documentation in sync with the codebase and provides a user-friendly interface for API exploration.

## Lessons Learned

As a first-time user of NestJS and Redis, transitioning from Express.js, this project provided invaluable insights:

- **NestJS: The Power of Opinionated Frameworks:**

  - **Structure and Modularity:** Coming from the more unopinionated nature of Express.js, NestJS's clear module, controller, and service structure enforces a highly organized and scalable architecture, making it easier to manage complex applications.
  - **Dependency Injection (DI):** Understanding and leveraging NestJS's DI system was a game-changer. It simplifies testing, promotes loose coupling, and makes code more maintainable.
  - **Decorators and Metadata:** The extensive use of decorators (`@Module`, `@Controller`, `@Injectable`) provides a powerful and concise way to define application logic and metadata, streamlining development.

- **Redis: Beyond a Simple Cache:**
  - **Versatility:** Redis proved to be far more than just a caching layer. Its ability to handle data with an expiration (TTL) made it ideal for time-sensitive, temporary data storage like OTPs.
  - **Performance:** The speed of Redis for read/write operations is remarkable, making it perfect for high-throughput scenarios.

## Architecture

The project follows a microservices pattern, orchestrated within an Nx monorepo.

- **`apps/user-ui`**: The main customer-facing frontend application built with Next.js.
- **`apps/api-gateway`**: A NestJS application that serves as the single entry point for all client requests. It routes traffic to the appropriate backend microservices.
- **`apps/auth-service`**: A NestJS microservice dedicated to handling user authentication, registration, sessions, and profiles.
- **`libs/`**: Contains shared code, types, and utilities used across multiple applications.

## Tech Stack

- **Frontend:** React, Next.js, TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Caching:** Redis
- **Monorepo Management:** Nx

## Getting Started

Follow these steps to get the entire platform running on your local machine.

### Prerequisites

- Node.js (v18 or higher)
- Docker

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/tec-shop.git
cd tec-shop
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Backend services require environment variables to run. For a detailed guide on setting up the authentication service, please refer to its dedicated documentation.

**>> [Read the `auth-service` documentation for setup instructions](/apps/auth-service/DOCUMENTATION.md)**

### 4. Set Up the Database

1.  **Start a PostgreSQL database using Docker.**

    ```bash
    docker run --name tec-shop-db -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres
    ```

2.  **Run database migrations.** After configuring your `.env` file for the `auth-service`, run the following command from the project root to apply the database schema:
    ```bash
    npx prisma migrate dev --schema=apps/auth-service/prisma/schema.prisma
    ```

## Running the Application

### Running the Entire Platform (Recommended)

To launch the Next.js frontend, the API gateway, and all backend microservices simultaneously, run:

```bash
npm run dev
```

- **User UI** will be available at `http://localhost:3000`
- **API Gateway** will be available at `http://localhost:4000`

### Running Individual Applications

You can also run each application independently:

```bash
# Run the frontend
nx serve user-ui

# Run the API Gateway
nx serve api-gateway

# Run the Authentication Service
nx serve auth-service
```

## API Documentation (Swagger)

Once the backend services are running, you can access the interactive API documentation for the `api-gateway` at:

[http://localhost:4000/api/docs](http://localhost:4000/api/docs)

## Testing

To run the test suites for the backend applications and libraries:

```bash
nx test api-gateway
nx test auth-service
```

_Note: The `user-ui` application does not currently have a test suite._
