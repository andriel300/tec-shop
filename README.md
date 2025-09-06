# Tec-Shop: Modern Microservices E-commerce Platform

## 🚀 Overview

Tec-Shop is a cutting-edge e-commerce platform built with a microservices architecture, leveraging the power of NestJS and Nx. Designed for scalability, maintainability, and developer experience, this project showcases modern backend development practices, robust authentication, and efficient tooling.

## ✨ Current Features & Strengths:

Backend (NestJS - `auth-service` & `api-gateway`)

- Robust Authentication System:
  - Comprehensive user registration (email/password, OTP verification).
  - Flexible login options (email/password, passwordless OTP).
  - Secure password reset flow.
  - Integrated Google OAuth 2.0 for social logins.
  - JWT-based authentication for stateless sessions.
  - Advanced Logout: Implemented secure JWT blacklisting using Redis, which is a strong security practice for invalidating tokens.
- API Gateway (`api-gateway`):
  - Centralized entry point for microservices.
  - Global API prefix (/api) for consistent routing.
  - CORS configuration for secure cross-origin requests.
  - Integrated Swagger/OpenAPI for excellent API documentation and discoverability.
- Data Management:
  - Prisma ORM for type-safe and efficient database interactions with MongoDB.
  - Redis for high-performance caching and temporary data storage (OTPs, JWT blacklist).
- Developer Experience & Tooling:
  - Nx Monorepo: Streamlines development, sharing code, and managing multiple applications/libraries within a single repository.
  - TypeScript: Provides strong typing, improving code quality and maintainability.
  - ESLint & Prettier: Ensures consistent code style and quality.
  - Jest: Configured for testing, indicating a commitment to code reliability.
  - Containerization: Presence of Dockerfile suggests readiness for containerized deployments.
  - CI/CD: .github/workflows/ci.yml indicates an automated Continuous Integration pipeline.

## 💡 Problems Solved & Best Practices Demonstrated

This project tackles common challenges in modern application development, showcasing elegant solutions:

- **Scalable Authentication:** Integrated **Auth0** as a robust Identity Provider (IdP) for social logins and external authentication, offloading complex identity management. This ensures secure, scalable, and flexible user authentication without reinventing the wheel.
- **Secure Passwordless/MFA:** Implemented a **One-Time Password (OTP)** system for enhanced security. This allows for passwordless login flows and can serve as a second factor for Multi-Factor Authentication (MFA), significantly improving user security and convenience.
- **Efficient Temporary Data Handling:** Utilized **Redis** as a high-performance, in-memory data store for short-lived data like OTPs. This ensures rapid storage and retrieval with automatic expiration, crucial for time-sensitive operations.
- **Reliable Email Delivery:** Integrated **Nodemailer** (via `@nestjs-modules/mailer`) for sending transactional emails (e.g., OTPs). This provides a reliable and configurable solution for critical user communications.
- **Monorepo Management:** Employed **Nx** to manage multiple NestJS applications and shared libraries within a single repository. This solves challenges related to code sharing, consistent tooling, and simplified dependency management in a microservices environment.
- **Automated API Documentation:** Configured **Swagger** for automatic generation of interactive API documentation. This eliminates manual documentation efforts, keeps documentation in sync with the codebase, and provides a user-friendly interface for API exploration and testing.
- **Robust Configuration Management:** Leveraged `@nestjs/config` for secure and flexible environment variable management, ensuring sensitive data is handled correctly across different environments.
- **Dependency Resolution in Monorepos:** Addressed complex module resolution issues (e.g., Prisma client, Webpack path aliases) inherent in monorepos, ensuring a smooth development experience.

## 🧠 Lessons Learned

As a first-time user of NestJS and Redis, transitioning from Express.js, this project provided invaluable insights:

- **NestJS: The Power of Opinionated Frameworks:**

  - **Structure and Modularity:** Coming from the more unopinionated nature of Express.js, NestJS's clear module, controller, and service structure initially felt restrictive but quickly proved its worth. It enforces a highly organized and scalable architecture, making it easier to manage complex applications and onboard new developers.
  - **Dependency Injection (DI):** Understanding and leveraging NestJS's DI system was a significant learning curve but a game-changer. It simplifies testing, promotes loose coupling, and makes code more maintainable. The `UnknownDependenciesException` was a clear indicator of when DI wasn't correctly configured, forcing a deeper understanding of module imports and exports.
  - **Decorators and Metadata:** The extensive use of decorators (`@Module`, `@Controller`, `@Injectable`, `@Get`, `@Post`, etc.) provides a powerful and concise way to define application logic and metadata, streamlining development compared to manual routing and middleware setup in Express.
  - **Built-in Features:** NestJS's out-of-the-box support for features like validation pipes, exception filters, and Swagger integration significantly reduces boilerplate and accelerates development, allowing focus on business logic.

- **Redis: Beyond a Simple Cache:**
  - **Versatility:** Redis proved to be far more than just a caching layer. Its ability to handle various data structures (strings for OTPs, with expiration) made it ideal for time-sensitive, temporary data storage, which is crucial for OTP systems.
  - **Performance:** The speed of Redis for read/write operations is remarkable, making it perfect for high-throughput scenarios like OTP generation and verification.
  - **Connection Management:** Understanding how to properly manage Redis client connections (e.g., `ioredis` client lifecycle with `onModuleInit` and `onModuleDestroy`) was key to preventing connection leaks and ensuring application stability.

This project reinforced the value of structured frameworks for large-scale applications and the power of specialized tools like Redis for specific data handling needs.

- I will add many more lessons as I continue the project

## 🏗️ Architecture

The project follows a microservices pattern, orchestrated within an Nx monorepo.

- **`apps/api-gateway`**: The entry point for all client requests, responsible for routing and potentially request aggregation.
- **`apps/auth-service`**: A dedicated service handling all authentication and authorization logic, including user management, JWT issuance/validation, and OTP flows.
- **`libs/common`**: A shared library containing common utilities, filters, and middleware used across multiple services, promoting code reuse and consistency.
- **Prisma**: Used as the ORM for database interactions, providing a type-safe and efficient way to manage data.

## 💻 Tech Stack

- **Framework:** [NestJS](https://nestjs.com/) - A progressive Node.js framework for building efficient, reliable and scalable server-side applications.
- **Monorepo Tool:** [Nx](https://nx.dev/) - A smart, fast and extensible build system for monorepos.
- **Language:** [TypeScript](https://www.typescriptlang.org/) - A typed superset of JavaScript that compiles to plain JavaScript.
- **Database ORM:** [Prisma](https://www.prisma.io/) - Next-generation ORM for Node.js and TypeScript.
- **Database:** [MongoDB](https://www.mongodb.com/) - A NoSQL, document-oriented database.
- **Authentication:** [Auth0](https://auth0.com/) - A flexible, drop-in solution to add authentication and authorization services to your applications.
- **Caching/Messaging:** [Redis](https://redis.io/) - An open source (BSD licensed), in-memory data structure store, used as a database, cache, and message broker.
- **Emailing:** [Nodemailer](https://nodemailer.com/) - A module for Node.js applications to allow easy as cake email sending.
- **Validation:** [Class-validator](https://github.com/typestack/class-validator) - Decorator-based validation for TypeScript.
- **Testing:** [Jest](https://jestjs.io/) - A delightful JavaScript Testing Framework with a focus on simplicity.
- **Linting:** [ESLint](https://eslint.org/) - Pluggable JavaScript linter.
- **Formatting:** [Prettier](https://prettier.io/) - An opinionated code formatter.

## 🚀 Getting Started

To get this project up and running on your local machine:

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (v9 or higher recommended)
- Docker (for Redis, if not using a cloud provider)
- A Redis instance (local Docker or cloud provider like Upstash)
- SMTP credentials (e.g., from Mailtrap.io for testing)
- Auth0 API credentials (Domain, Audience)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/tec-shop.git
    cd tec-shop
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Environment Variables:**
    Create a `.env` file in `apps/auth-service/` with the following structure, filling in your credentials:

    ```env
    # Auth0 Credentials
    AUTH0_ISSUER_URL=https://<YOUR_AUTH0_DOMAIN>/
    AUTH0_AUDIENCE=<YOUR_AUTH0_API_IDENTIFIER>

    # Redis Connection (e.g., from Upstash)
    REDIS_URL="rediss://default:YOUR_UPSTASH_PASSWORD@your-upstash-host:6379"

    # SMTP Email Configuration (e.g., from Mailtrap.io sandbox)
    SMTP_HOST=sandbox.smtp.mailtrap.io
    SMTP_PORT=587
    SMTP_USER=your_smtp_username
    SMTP_PASS=your_smtp_password
    SMTP_FROM=noreply@tec-shop.com
    SMTP_SECURE=false

    # Secret for signing our own application JWTs
    JWT_SECRET=your_long_random_secret_key_here
    ```

    - **Note:** For `JWT_SECRET`, you can generate one using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

### Running the Application

To start all services in development mode:

```bash
npm run dev
```

This will typically start the `auth-service` on `http://localhost:6001/api`.

## 🛠️ Development & Tooling

- **Nx:** Leverage Nx commands for generating, building, testing, and serving applications and libraries.
  - `npx nx serve auth-service`: Serve a specific application.
  - `npx nx build auth-service`: Build a specific application.
  - `npx nx graph`: Visualize the project's dependency graph.
- **Prisma:** Manage your database schema and migrations.
  - `npx prisma generate`: Generate the Prisma client after schema changes.
- **ESLint & Prettier:** Ensure code quality and consistent formatting.

## 🧪 Testing

- **Unit Tests:**
  ```bash
  npx nx test auth-service
  ```
- **End-to-End Tests:**
  ```bash
  npx nx e2e auth-service-e2e
  ```

## 📚 API Documentation (Swagger)

Once the `auth-service` is running, you can access the interactive API documentation at:

[http://localhost:6001/api/docs](http://localhost:6001/api/docs)

## 📸 Screenshots

to add later.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
