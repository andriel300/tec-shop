# TecShop - System Design Documentation

> **Last Updated:** October 7, 2025
> **Version:** 1.0
> **Architecture:** Microservices with API Gateway

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Services](#core-services)
3. [Data Architecture](#data-architecture)
4. [Communication Patterns](#communication-patterns)
5. [Security Architecture](#security-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Infrastructure & DevOps](#infrastructure--devops)
8. [File Upload Architecture](#file-upload-architecture)
9. [Marketplace Business Model](#marketplace-business-model)
10. [Environment Configuration](#environment-configuration)

---

## Architecture Overview

TecShop is a **multi-vendor e-commerce marketplace** built with a microservices architecture using NestJS for backend services and Next.js for frontend applications, all managed within an **Nx monorepo**.

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  user-ui (Next.js)          │  seller-ui (Next.js)              │
│  Port: 3000                 │  Port: 3001                        │
│  Customer Interface         │  Seller Dashboard                  │
└────────────┬────────────────┴───────────────┬────────────────────┘
             │                                │
             │ HTTP/REST + Cookies            │
             │                                │
┌────────────▼────────────────────────────────▼────────────────────┐
│                     API GATEWAY (Port 8080)                       │
│  • REST API with Swagger docs                                    │
│  • JWT Authentication (httpOnly cookies)                         │
│  • RBAC Authorization (JwtAuthGuard, RolesGuard)                │
│  • Rate limiting & Throttling                                    │
│  • Helmet security headers (CSP, HSTS, XSS)                     │
│  • CORS configuration                                            │
│  • ImageKit integration (file upload)                           │
└───┬─────────┬──────────┬──────────┬──────────────────────────────┘
    │         │          │          │
    │ TCP     │ TCP      │ TCP      │ TCP (mTLS supported)
    │         │          │          │
┌───▼───┐ ┌──▼────┐ ┌───▼────┐ ┌──▼──────────┐
│ Auth  │ │ User  │ │ Seller │ │  Product    │
│Service│ │Service│ │Service │ │  Service    │
│:6001  │ │:6002  │ │:6003   │ │  :6004      │
└───┬───┘ └──┬────┘ └───┬────┘ └──┬──────────┘
    │        │          │          │
┌───▼────────▼──────────▼──────────▼──────────┐
│        MongoDB (Separate Databases)          │
│  • auth_service_dev    • user_service_dev   │
│  • seller_service_dev  • product_service_dev│
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│        External Services                      │
│  • Redis (Upstash) - Sessions, OTP, Cache    │
│  • ImageKit - CDN & Image Management         │
│  • Stripe - Payment Processing               │
│  • Google OAuth - Social Authentication      │
│  • MailSlurp - Email Service                 │
└──────────────────────────────────────────────┘
```

### Architecture Principles

- **Domain-Driven Design**: Each microservice represents a bounded context
- **Database per Service**: Ensures service autonomy and independent scaling
- **API Gateway Pattern**: Single entry point for all client requests
- **Event-Driven (Async)**: TCP message patterns for inter-service communication
- **Fail-Safe Security**: Services refuse to start without required configuration

---

## Core Services

### 1. API Gateway (Port 8080)

**Purpose:** Single entry point for all client requests, handles authentication, routing, and protocol translation.

**Responsibilities:**
- HTTP/REST endpoints with Swagger documentation (`/api-docs`)
- Authentication & authorization enforcement
- Request validation & transformation
- File upload handling (ImageKit integration)
- Proxying to microservices via TCP
- Rate limiting and throttling
- Security headers management

**Key Technologies:**
- NestJS with Express
- Passport.js (JWT, Google OAuth)
- Class-validator for DTOs
- Helmet for security headers
- Pino for structured logging
- FilesInterceptor for multipart/form-data

**Endpoints:**
- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User management
- `/api/seller/*` - Seller operations
- `/api/products/*` - Product catalog
- `/api/categories/*` - Category management
- `/api/brands/*` - Brand management
- `/api/discounts/*` - Discount codes

---

### 2. Auth Service (Port 6001)

**Purpose:** Centralized authentication and authorization service.

**Responsibilities:**
- User registration with email verification
- Login with JWT token generation
- Password hashing (bcrypt with salt rounds)
- Email verification with OTP (3-attempt limit, Redis-backed)
- Password reset flow
- Token blacklisting (Redis)
- Cross-service profile creation (User/Seller)

**Database Models:**
```prisma
model User {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  username      String   @unique
  email         String   @unique
  password      String
  role          Role     @default(CUSTOMER)
  isVerified    Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model RefreshToken {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model PasswordResetToken {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

**Inter-Service Communication:**
- → User Service: Profile creation with HMAC signing
- → Seller Service: Seller profile creation with HMAC signing

**Message Patterns:**
- `auth-register`
- `auth-login`
- `auth-verify-email`
- `auth-forgot-password`
- `auth-reset-password`
- `auth-logout`

---

### 3. User Service (Port 6002)

**Purpose:** Manages customer profiles and user-specific data.

**Responsibilities:**
- Customer profile management
- User preferences & settings
- Address management
- Order history (future)
- Wishlist management (future)

**Database Models:**
```prisma
model UserProfile {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  authId    String   @unique // Links to Auth Service User.id
  firstName String?
  lastName  String?
  phone     String?
  avatar    String?
  addresses Address[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Message Patterns:**
- `user-create-profile`
- `user-get-profile`
- `user-update-profile`
- `user-delete-profile`

---

### 4. Seller Service (Port 6003)

**Purpose:** Manages seller accounts, shops, and payment integrations.

**Responsibilities:**
- Seller profile management
- Shop creation & management
- Stripe account integration
- Bank account & card management
- Shop verification for product operations
- Seller analytics (future)

**Database Models:**
```prisma
model Seller {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  authId      String   @unique // Links to Auth Service User.id
  businessName String?
  description  String?
  shops        Shop[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Shop {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  sellerId    String   @db.ObjectId
  name        String
  description String?
  logo        String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model StripeAccount {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  sellerId      String   @db.ObjectId
  stripeAccountId String @unique
  status        String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**Inter-Service Communication:**
- ← Product Service: Shop ownership verification via `seller-verify-shop` and `seller-verify-shop-ownership` message patterns

**Message Patterns:**
- `seller-create-profile`
- `seller-create-shop`
- `seller-get-shops`
- `seller-verify-shop`
- `seller-verify-shop-ownership`
- `seller-update-shop`

---

### 5. Product Service (Port 6004)

**Purpose:** Manages product catalog, categories, brands, and inventory.

**Responsibilities:**
- Product CRUD operations (seller-owned)
- Category hierarchy management (admin-only)
- Brand management (admin-only)
- Product variants & attributes
- Inventory tracking
- Product search & filtering
- Discount code management
- Product analytics (views, sales)

**Database Models:**
```prisma
model Product {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  shopId      String   @db.ObjectId // Links to Seller Service Shop.id
  sellerId    String   @db.ObjectId // Links to Seller Service Seller.id
  name        String
  description String
  categoryId  String   @db.ObjectId
  brandId     String?  @db.ObjectId
  productType ProductType @default(SIMPLE)
  price       Float
  salePrice   Float?
  stock       Int
  images      String[] // ImageKit URLs
  hasVariants Boolean  @default(false)
  variants    ProductVariant[]
  tags        String[]
  youtubeUrl  String?
  slug        String?  @unique
  status      ProductStatus @default(DRAFT)
  visibility  ProductVisibility @default(PUBLIC)
  isActive    Boolean  @default(true)
  isFeatured  Boolean  @default(false)
  views       Int      @default(0)
  sales       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Category {
  id          String     @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  slug        String     @unique
  description String?
  parentId    String?    @db.ObjectId
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Brand {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String   @unique
  slug        String   @unique
  logo        String?
  description String?
  isActive    Boolean  @default(true)
  isPopular   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model DiscountCode {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  code        String   @unique
  description String?
  discountType DiscountType
  discountValue Float
  minPurchase Float?
  maxDiscount Float?
  startDate   DateTime
  endDate     DateTime
  usageLimit  Int?
  usageCount  Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Inter-Service Communication:**
- → Seller Service: Shop verification before product operations

**Message Patterns:**
- `product-create-product`
- `product-get-products`
- `product-get-product`
- `product-update-product`
- `product-delete-product`
- `product-increment-product-views`

---

## Data Architecture

### Database Strategy: Database per Service

Each microservice maintains its **own MongoDB database**, ensuring:
- **Service Autonomy**: Services can evolve independently
- **Independent Scaling**: Scale databases based on service needs
- **Schema Evolution**: No cross-service schema dependencies
- **Fault Isolation**: Database failure affects only one service

**Database Naming Convention:**
```
auth_service_dev
user_service_dev
seller_service_dev
product_service_dev
```

### Cross-Service Data Relationships

Services maintain referential integrity through **foreign key IDs** without direct database joins:

```
Auth Service (User.id)
    ↓ authId (String)
Seller Service (Seller.authId)
    ↓ sellerId (String)
Seller Service (Shop.sellerId)
    ↓ shopId (String)
Product Service (Product.shopId)
```

**Validation Strategy:**
- Cross-service validation via TCP message patterns
- Example: Product Service calls Seller Service to verify shop ownership before product operations

### Prisma ORM Architecture

```
libs/
├── prisma-schemas/              # Schema definitions
│   ├── auth-schema/
│   │   └── prisma/schema.prisma
│   ├── user-schema/
│   │   └── prisma/schema.prisma
│   ├── seller-schema/
│   │   └── prisma/schema.prisma
│   └── product-schema/
│       └── prisma/schema.prisma
└── prisma-clients/              # Generated Prisma clients
    ├── auth-client/src/index.ts
    ├── user-client/src/index.ts
    ├── seller-client/src/index.ts
    └── product-client/src/index.ts
```

**Workflow:**
```bash
# 1. Edit schema
vim libs/prisma-schemas/product-schema/prisma/schema.prisma

# 2. Generate TypeScript client
npm run prisma:generate

# 3. Push schema changes to MongoDB
npm run prisma:db-push

# 4. (Optional) Open Prisma Studio
npm run prisma:studio:product
```

---

## Communication Patterns

### 1. Client ↔ API Gateway: REST over HTTP

**Protocol:** HTTP/1.1 with JSON payloads

**Authentication:**
- JWT tokens stored in httpOnly cookies
- Authorization header support for API clients

**CORS Configuration:**
```typescript
app.enableCors({
  origin: [
    'http://localhost:3000', // user-ui
    'http://localhost:3001', // seller-ui
  ],
  credentials: true, // Allow cookies
});
```

**Rate Limiting:**
- **Short**: 20 requests/minute (general operations)
- **Medium**: 10 requests/15 minutes (auth operations)
- **Long**: 100 requests/minute (high-frequency operations)

---

### 2. API Gateway ↔ Microservices: TCP Message Patterns

**Protocol:** NestJS TCP Transport

**Why TCP?**
- Low latency communication
- Built-in serialization/deserialization
- Type-safe message contracts
- Supports mTLS for encryption
- Request/response and event patterns

**Example Request/Response:**
```typescript
// API Gateway
return firstValueFrom(
  this.productService.send('product-create-product', {
    sellerId: user.userId,
    productData,
    imageUrls,
  })
);

// Product Service
@MessagePattern('product-create-product')
async create(@Payload() payload: CreateProductPayload) {
  return this.productService.create(
    payload.sellerId,
    payload.productData,
    payload.imageUrls
  );
}
```

**Connection Configuration:**
```typescript
ClientsModule.register([
  {
    name: 'PRODUCT_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.PRODUCT_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.PRODUCT_SERVICE_PORT || '6004', 10),
      tlsOptions: {
        key: readFileSync('certs/api-gateway/api-gateway-key.pem'),
        cert: readFileSync('certs/api-gateway/api-gateway-cert.pem'),
        ca: readFileSync('certs/ca/ca-cert.pem'),
        rejectUnauthorized: true,
      },
    },
  },
]),
```

---

### 3. Inter-Service Communication: HMAC-Signed Requests

For **sensitive cross-service operations** (e.g., profile creation), services use HMAC signatures:

**Flow:**
```
1. Auth Service creates User
2. Auth Service signs request with HMAC using SERVICE_MASTER_SECRET
3. User Service receives request
4. User Service verifies HMAC signature
5. If valid, creates UserProfile with authId
```

**Security Benefits:**
- Prevents unauthorized inter-service calls
- Ensures request integrity (tamper-proof)
- Shared secret (`SERVICE_MASTER_SECRET`) known only to services

---

## Security Architecture

### Multi-Layer Security Model

#### Layer 1: Network Security

**mTLS (Mutual TLS):**
- Certificate-based authentication between services
- Encrypts TCP communication
- Prevents man-in-the-middle attacks

**Certificate Structure:**
```
certs/
├── ca/
│   ├── ca-cert.pem       # Certificate Authority
│   └── ca-key.pem
├── api-gateway/
│   ├── api-gateway-cert.pem
│   └── api-gateway-key.pem
├── auth-service/
│   ├── auth-service-cert.pem
│   └── auth-service-key.pem
├── user-service/
├── seller-service/
└── product-service/
```

**Certificate Generation:**
```bash
./generate-certs.sh --all              # Generate all certificates
./generate-certs.sh --service auth     # Generate for specific service
./generate-certs.sh --clean            # Remove all certificates
```

---

#### Layer 2: Authentication

**JWT Strategy:**
- **Access Tokens**: Short-lived (15 minutes)
- **Refresh Tokens**: Long-lived (7 days), stored in database
- **httpOnly Cookies**: Prevents XSS attacks
- **Secure Flag**: HTTPS-only in production
- **SameSite**: CSRF protection

**Google OAuth Integration:**
- Social authentication for faster onboarding
- Reduces password management burden
- Leverages Google's security infrastructure

**Email Verification:**
- OTP (One-Time Password) sent via email
- 3-attempt limit per OTP
- Redis-backed storage with expiration
- Account remains unverified until confirmed

---

#### Layer 3: Authorization (RBAC)

**Role-Based Access Control:**

```typescript
// Guard combination
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
async adminOnlyEndpoint() { }

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
async sellerOnlyEndpoint() { }

@UseGuards(JwtAuthGuard)
async authenticatedEndpoint() { }
```

**User Roles:**
- **ADMIN**: Platform administration (categories, brands, user management)
- **SELLER**: Shop and product management
- **CUSTOMER**: Shopping, orders, reviews

**Permission Matrix:**

| Endpoint             | ADMIN | SELLER | CUSTOMER |
|----------------------|-------|--------|----------|
| Create Category      | ✅     | ❌      | ❌        |
| Create Brand         | ✅     | ❌      | ❌        |
| Create Product       | ❌     | ✅      | ❌        |
| Create Shop          | ❌     | ✅      | ❌        |
| View Products        | ✅     | ✅      | ✅        |
| Update Own Product   | ❌     | ✅      | ❌        |
| Delete Any Product   | ✅     | ❌      | ❌        |

---

#### Layer 4: API Security

**Helmet Security Headers:**
```typescript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  xssFilter: true,
})
```

**Input Validation:**
```typescript
// DTO with class-validator
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsArray()
  @ArrayMaxSize(4)
  images: string[];
}
```

**Password Security:**
- Bcrypt hashing with salt rounds
- Minimum password length enforced
- No password storage in logs
- Secure password reset flow

**Token Blacklisting:**
- Redis-backed logout
- Invalidates JWT tokens
- Prevents token reuse after logout

---

#### Layer 5: Application Security

**Fail-Secure Design:**
```typescript
// Services refuse to start without required configuration
if (!config.JWT_SECRET || config.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}

if (!config.SERVICE_MASTER_SECRET) {
  throw new Error('SERVICE_MASTER_SECRET is required');
}
```

**Environment Validation:**
```typescript
// ConfigService with strict validation
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment, // Custom validation function
    }),
  ],
})
```

**No Default Secrets:**
- All secrets must be explicitly configured
- No fallback values that could compromise security
- Application crashes if critical configuration is missing

---

## Frontend Architecture

### Technology Stack

Both `user-ui` and `seller-ui` use the same modern React stack:

**Core:**
- **Next.js 15**: React framework with server components
- **React 19**: Latest React features
- **TypeScript**: Type safety

**Styling:**
- **Tailwind CSS**: Utility-first CSS framework
- **Tailwind Plugins**: Forms, Typography, Aspect Ratio
- **Styled Components**: Component-scoped styles (where needed)
- **Class Variance Authority**: Component variants
- **clsx + tailwind-merge**: Conditional class merging

**State Management:**
- **Jotai**: Atomic state management
- **TanStack Query (React Query)**: Server state & caching

**Forms:**
- **TanStack Form**: Type-safe forms with validation
- **Zod**: Schema validation

**UI Components:**
- **Radix UI**: Accessible component primitives
  - Checkbox
  - Dialog
  - Dropdown Menu
  - Tooltip
- **Lucide React**: Icon library
- **Framer Motion**: Animations

**Rich Text:**
- **Tiptap**: Headless rich text editor
- **Tiptap Starter Kit**: Common extensions
- **Tiptap Placeholder Extension**: Input placeholder

**HTTP Client:**
- **Axios**: HTTP requests with interceptors

---

### Application Structure

#### user-ui (Customer Portal)

```
apps/user-ui/src/
├── app/
│   ├── (routes)/          # Route groups
│   │   ├── page.tsx       # Home page
│   │   ├── products/      # Product listing
│   │   ├── product/[id]/  # Product detail
│   │   └── cart/          # Shopping cart
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Reusable UI components
│   ├── layout/            # Header, Footer, Navigation
│   └── product/           # Product-specific components
├── lib/
│   ├── api/               # API client functions
│   ├── utils/             # Utility functions
│   └── hooks/             # Custom React hooks
└── types/                 # TypeScript type definitions
```

---

#### seller-ui (Seller Dashboard)

```
apps/seller-ui/src/
├── app/
│   ├── (routes)/
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # Dashboard overview
│   │   │   ├── products/             # Product management
│   │   │   ├── create-product/       # Product creation form
│   │   │   ├── shops/                # Shop management
│   │   │   ├── discounts/            # Discount codes
│   │   │   └── settings/             # Seller settings
│   │   └── auth/                     # Authentication pages
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── dashboard/         # Dashboard-specific components
│   ├── forms/             # Complex form components
│   │   ├── ProductForm/
│   │   ├── ShopForm/
│   │   └── DiscountForm/
│   └── rich-text/         # Tiptap editor components
├── lib/
│   ├── api/
│   │   ├── client.ts      # Axios instance
│   │   ├── products.ts    # Product API calls
│   │   ├── shops.ts       # Shop API calls
│   │   └── discounts.ts   # Discount API calls
│   └── utils/
└── types/
```

---

### Key Features

#### Product Creation Form (seller-ui)

**Multi-step form with:**
- Product information (name, description, category, brand)
- Pricing (regular price, sale price)
- Inventory (stock quantity)
- Image upload (max 4 images, 5MB each)
- Product variants (optional)
- SEO fields (optional)
- Tags and YouTube URL
- Discount code assignment
- Status and visibility settings

**Rich Text Editor (Tiptap):**
```typescript
const editor = useEditor({
  extensions: [StarterKit, Placeholder],
  content: productData.description,
  onUpdate: ({ editor }) => {
    form.setFieldValue('description', editor.getHTML());
  },
});
```

**Image Upload:**
```typescript
const handleImageUpload = (files: FileList) => {
  const validImages = Array.from(files).filter((file) => {
    // Max 5MB
    if (file.size > 5 * 1024 * 1024) return false;
    // Only images
    if (!file.type.startsWith('image/')) return false;
    return true;
  });

  setProductImages([...productImages, ...validImages].slice(0, 4));
};
```

---

### API Integration

**Axios Instance with Interceptors:**
```typescript
// libs/seller-ui/src/lib/api/client.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080',
  withCredentials: true, // Include httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  // Add custom headers if needed
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);
```

**TanStack Query Integration:**
```typescript
// Product creation mutation
const createProductMutation = useMutation({
  mutationFn: (data: CreateProductData) => createProduct(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    toast.success('Product created successfully!');
    router.push('/dashboard/products');
  },
  onError: (error) => {
    toast.error('Failed to create product');
  },
});
```

---

## Infrastructure & DevOps

### Monorepo Management (Nx)

**Workspace Structure:**
```
tec-shop/
├── apps/                    # Deployable applications
│   ├── api-gateway/
│   ├── auth-service/
│   ├── user-service/
│   ├── seller-service/
│   ├── product-service/
│   ├── user-ui/
│   └── seller-ui/
├── libs/                    # Shared libraries
│   ├── shared/
│   │   ├── dto/            # Data Transfer Objects
│   │   ├── imagekit/       # ImageKit service
│   │   └── validation/     # Validation schemas
│   ├── prisma-schemas/
│   └── prisma-clients/
├── docs/                    # Documentation
├── certs/                   # mTLS certificates
├── nx.json                  # Nx configuration
├── package.json             # Root package.json
└── tsconfig.base.json       # Shared TypeScript config
```

**Nx Benefits:**
- **Incremental Builds**: Only rebuild what changed
- **Dependency Graph**: Visualize project dependencies (`nx graph`)
- **Task Caching**: Cache build/test results for speed
- **Parallel Execution**: Run tasks across multiple projects simultaneously
- **Consistent Tooling**: Shared linting, testing, build configs

---

### Development Scripts

```bash
# Development
npm run dev                    # Start all services
npm run user-ui               # User frontend only (port 3000)
npm run seller-ui             # Seller frontend only (port 3001)
npx nx serve api-gateway      # API Gateway only
npx nx serve product-service  # Product service only

# Build
npx nx build api-gateway      # Build specific service
npx nx run-many --target=build --all  # Build all projects

# Database
npm run prisma:generate       # Generate all Prisma clients
npm run prisma:db-push        # Push all schema changes
npm run prisma:studio:auth    # Open Prisma Studio for auth DB
npm run prisma:studio:product # Open Prisma Studio for product DB
npm run prisma:studio:all     # Open all Prisma Studios

# Testing & Quality
npx nx test <service-name>    # Run tests for service
npm run test                  # Run all tests
npm run lint                  # Lint all projects
npm run typecheck             # Type check all projects

# Seeding
npm run seed:brands           # Seed product brands
npm run seed:categories       # Seed product categories
npm run seed:all              # Seed all data

# Nx Utilities
npx nx graph                  # Visualize dependency graph
npx nx sync                   # Sync workspace configuration
npx nx reset                  # Clear Nx cache
```

---

### Logging & Observability

**Structured Logging with Pino:**

```typescript
// NestJS integration
LoggerModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    pinoHttp: {
      level: config.get('NODE_ENV') !== 'production' ? 'debug' : 'info',
      transport: config.get('NODE_ENV') !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              levelFirst: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
  }),
});
```

**Log Levels:**
- **DEBUG**: Development-only detailed logs
- **INFO**: General application flow
- **WARN**: Warning conditions
- **ERROR**: Error conditions with stack traces

**Example Logs:**
```json
{
  "level": "info",
  "time": 1696636800000,
  "msg": "File uploaded successfully",
  "service": "ImageKitService",
  "url": "https://ik.imagekit.io/andrieltecshop/products/image-123.jpg",
  "fileId": "abc123"
}
```

---

### Build & Deployment

**Docker Support:**
- Nx provides Docker executors
- Each service can be containerized independently
- Multi-stage builds for optimized images

**Environment Configuration:**
```bash
# Development
NODE_ENV=development

# Production
NODE_ENV=production
```

**Deployment Strategies:**
- **Containerized**: Each service as a Docker container
- **Orchestration**: Kubernetes or Docker Compose
- **CI/CD**: GitHub Actions, GitLab CI, or Jenkins
- **Monitoring**: Application metrics, health checks, logging

---

## File Upload Architecture

### ImageKit CDN Integration

**Previous Architecture (Multer):**
```
Frontend → API Gateway (saves to ./uploads/) → Product Service
                ↓
           Local filesystem
           (not scalable)
```

**Current Architecture (ImageKit):**
```
Frontend → API Gateway (uploads to ImageKit) → Product Service
                ↓                                      ↓
           ImageKit CDN                         Stores CDN URLs
                ↓
           Global delivery
```

---

### Upload Flow

**Step-by-Step Process:**

1. **seller-ui uploads files**
   ```typescript
   const formData = new FormData();
   formData.append('name', 'Product Name');
   formData.append('description', 'Description');
   images.forEach((image) => formData.append('images', image));

   await createProduct(formData);
   ```

2. **API Gateway ProductController receives request**
   ```typescript
   @Post()
   @UseInterceptors(FilesInterceptor('images', 4))
   async createProduct(
     @UploadedFiles() files: Express.Multer.File[]
   ) {
     // Validate files (type, size)
     this.validateFiles(files);

     // Upload to ImageKit
     const uploadResults = await this.imagekitService.uploadMultipleFiles(
       files.map((file) => ({
         buffer: file.buffer,
         originalname: file.originalname,
       })),
       'products'
     );

     // Extract URLs
     const imageUrls = uploadResults.map((r) => r.url);

     // Send to Product Service
     return this.productService.send('product-create-product', {
       sellerId,
       productData,
       imageUrls,
     });
   }
   ```

3. **ImageKit Service processes upload**
   ```typescript
   async uploadFile(file: Buffer, fileName: string) {
     const uniqueFileName = `${fileName}-${Date.now()}-${random()}.ext`;

     const response = await this.imagekit.upload({
       file: file.toString('base64'),
       fileName: uniqueFileName,
       folder: '/products',
     });

     return {
       url: response.url,
       fileId: response.fileId,
     };
   }
   ```

4. **Product Service receives URLs**
   ```typescript
   @MessagePattern('product-create-product')
   async create(@Payload() payload) {
     const { sellerId, productData, imageUrls } = payload;

     // Validate at least one image
     if (!imageUrls || imageUrls.length === 0) {
       throw new BadRequestException('At least one image required');
     }

     // Save to database
     return this.productService.create(sellerId, productData, imageUrls);
   }
   ```

5. **Images accessible via ImageKit CDN**
   ```
   https://ik.imagekit.io/andrieltecshop/products/laptop-1234567890-987654321.jpg
   ```

---

### File Validation

**API Gateway validates:**
- **File Type**: Only `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
- **File Size**: Maximum 5MB per image
- **File Count**: Maximum 4 images per product
- **Buffer Access**: Files buffered in memory (not saved to disk)

**ImageKit Service validates:**
- **Upload Limits**: Enforced by ImageKit
- **Quota Management**: ImageKit plan limits
- **Error Handling**: Graceful failures with logging

---

### ImageKit Features

**Automatic Optimizations:**
- Image compression
- Format conversion (WebP, AVIF)
- Lazy loading support
- Responsive images

**URL Transformations:**
```
# Original
https://ik.imagekit.io/andrieltecshop/products/image.jpg

# Thumbnail (200x200)
https://ik.imagekit.io/andrieltecshop/products/image.jpg?tr=w-200,h-200

# WebP format
https://ik.imagekit.io/andrieltecshop/products/image.jpg?tr=f-webp

# Multiple transformations
https://ik.imagekit.io/andrieltecshop/products/image.jpg?tr=w-400,h-300,q-80,f-webp
```

**Benefits:**
- **No Local Storage**: No server disk space used
- **Global CDN**: Fast delivery worldwide
- **Scalability**: Handles unlimited uploads
- **Transformations**: On-the-fly image manipulation
- **Analytics**: Image usage metrics

---

## Marketplace Business Model

### Platform Roles

```
┌─────────┐
│  ADMIN  │ Platform Owner
└────┬────┘
     │ creates/manages
     ▼
┌──────────────┐
│  Categories  │ Hierarchical taxonomy
│  Brands      │ Centralized brand directory
└──────────────┘
     ▲
     │ uses
┌────┴────┐
│ SELLER  │ Shop Owner
└────┬────┘
     │ creates
     ▼
┌──────────┐
│   Shop   │ Storefront
└────┬─────┘
     │ owns
     ▼
┌───────────┐
│  Product  │ Listing with variants
└─────┬─────┘
      │
      ▼ browses/purchases
┌──────────┐
│ CUSTOMER │ Buyer
└──────────┘
```

---

### Multi-Vendor Model

**Admin-Controlled (Platform-Wide):**
- Categories: Hierarchical taxonomy
- Brands: Shared brand directory
- User management
- Platform policies

**Seller-Controlled (Shop-Specific):**
- Products: Full CRUD operations
- Inventory: Stock management
- Pricing: Regular price, sale price
- Discounts: Shop-specific discount codes
- Shop settings: Name, description, logo

**Customer Access (Read-Only):**
- Browse products across all shops
- Search and filter
- View product details
- Add to cart (future)
- Purchase (future)

---

### Product Ownership Flow

```
1. Seller registers account (SELLER role)
   ↓
2. Seller creates Shop
   ↓
3. Shop verified by Seller Service
   ↓
4. Seller creates Product
   ↓
5. Product Service verifies shop ownership
   ↓
6. Product published (status: PUBLISHED, visibility: PUBLIC)
   ↓
7. Customers can browse product
```

---

### Revenue Model (Future)

**Commission-Based:**
- Platform takes percentage of each sale
- Seller receives payout after commission
- Stripe Connect for payment splitting

**Subscription-Based:**
- Monthly/yearly fees for shop operation
- Tiered plans (Basic, Pro, Enterprise)
- Feature-based pricing

**Hybrid:**
- Lower commission + subscription fee
- Free tier with higher commission
- Premium tier with lower commission

---

## Environment Configuration

### Required Environment Variables

**Authentication & Security:**
```bash
# JWT Configuration (REQUIRED)
JWT_SECRET=<min-32-characters>  # Enforced at startup
SERVICE_MASTER_SECRET=<secret>  # Inter-service HMAC

# Google OAuth
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
```

**Database Connections:**
```bash
# MongoDB Connections (one per service)
AUTH_SERVICE_DB_URL=mongodb+srv://<user>:<password>@<host>/auth_service_dev
USER_SERVICE_DB_URL=mongodb+srv://<user>:<password>@<host>/user_service_dev
SELLER_SERVICE_DB_URL=mongodb+srv://<user>:<password>@<host>/seller_service_dev
PRODUCT_SERVICE_DB_URL=mongodb+srv://<user>:<password>@<host>/product_service_dev
```

**Redis (Cache & Sessions):**
```bash
REDIS_URL=rediss://<user>:<password>@<host>:6379
```

**Email Service:**
```bash
SMTP_HOST=mailslurp.mx
SMTP_PORT=2465
SMTP_USER=<smtp-username>
SMTP_PASS=<smtp-password>
SMTP_FROM=noreply@tec-shop.com
SMTP_SECURE=true
```

**Payment Gateway:**
```bash
STRIPE_SECRET_KEY=sk_test_<key>
STRIPE_WEBHOOK_SECRET=whsec_<secret>
```

**ImageKit CDN:**
```bash
IMAGEKIT_PRIVATE_KEY=private_<key>
IMAGEKIT_PUBLIC_KEY=public_<key>
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/<your-id>
```

**Microservice Hosts:**
```bash
AUTH_SERVICE_HOST=localhost
AUTH_SERVICE_PORT=6001

USER_SERVICE_HOST=localhost
USER_SERVICE_PORT=6002

SELLER_SERVICE_HOST=localhost
SELLER_SERVICE_PORT=6003

PRODUCT_SERVICE_HOST=localhost
PRODUCT_SERVICE_PORT=6004
```

**Frontend URLs:**
```bash
FRONTEND_URL=http://localhost:3000        # user-ui
SELLER_UI_URL=http://localhost:3001      # seller-ui
BACKEND_URL=http://localhost:8080        # api-gateway
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080  # For Next.js client-side
```

**API Gateway:**
```bash
API_GATEWAY_URL=http://localhost:8080
PORT=8080
```

---

### Fail-Safe Configuration

**Services validate environment on startup:**

```typescript
// Example from Auth Service
export function validateEnvironment() {
  const required = [
    'JWT_SECRET',
    'SERVICE_MASTER_SECRET',
    'AUTH_SERVICE_DB_URL',
    'REDIS_URL',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
}
```

**Result:**
- Services refuse to start if configuration is invalid
- No silent failures or default secrets
- Clear error messages for missing configuration

---

## Appendix

### Nx Commands Reference

```bash
# Build
npx nx build <project>
npx nx run-many --target=build --all
npx nx run-many --target=build --projects=api-gateway,auth-service

# Serve/Dev
npx nx serve <project>
npx nx run-many --target=serve --all

# Test
npx nx test <project>
npx nx run-many --target=test --all
npx nx affected:test  # Only test affected projects

# Lint
npx nx lint <project>
npx nx run-many --target=lint --all

# Type Check
npx nx typecheck <project>

# Dependency Graph
npx nx graph

# Workspace Utilities
npx nx sync         # Sync TypeScript project references
npx nx reset        # Clear Nx cache
npx nx list         # List installed plugins
```

---

### mTLS Certificate Commands

```bash
# Generate all certificates
./generate-certs.sh --all

# Generate for specific service
./generate-certs.sh --service api-gateway
./generate-certs.sh --service auth-service
./generate-certs.sh --service user-service
./generate-certs.sh --service seller-service
./generate-certs.sh --service product-service

# Clean all certificates
./generate-certs.sh --clean
```

---

### Database Commands

```bash
# Prisma Generate
npm run prisma:generate  # All services
npx nx run @tec-shop/auth-schema:generate-types
npx nx run @tec-shop/user-schema:generate-types
npx nx run @tec-shop/seller-schema:generate-types
npx nx run @tec-shop/product-schema:generate-types

# Prisma DB Push
npm run prisma:db-push  # All services
npx nx run @tec-shop/auth-schema:db-push
npx nx run @tec-shop/product-schema:db-push

# Prisma Studio
npm run prisma:studio:all      # Open all (parallel)
npm run prisma:studio:auth     # Auth DB only
npm run prisma:studio:user     # User DB only
npm run prisma:studio:seller   # Seller DB only
npm run prisma:studio:product  # Product DB only

# Prisma Format
npm run prisma:format  # Format all schema files
```

---

### Technology Version Matrix

| Technology       | Version | Purpose                  |
| ---------------- | ------- | ------------------------ |
| Node.js          | 20.x    | Runtime                  |
| NestJS           | 11.x    | Backend framework        |
| Next.js          | 15.x    | Frontend framework       |
| React            | 19.0    | UI library               |
| TypeScript       | 5.8     | Type safety              |
| Prisma           | Latest  | ORM                      |
| MongoDB          | 6.x     | Database                 |
| Redis            | Latest  | Cache & sessions         |
| Nx               | 21.x    | Monorepo tools           |
| Tailwind CSS     | 3.4     | Styling                  |
| ImageKit         | Latest  | CDN & image optimization |
| Stripe           | Latest  | Payment processing       |
| Passport.js      | Latest  | Authentication           |
| Pino             | Latest  | Logging                  |
| TanStack Query   | 5.x     | Data fetching            |
| TanStack Form    | Latest  | Form management          |
| Jotai            | Latest  | State management         |
| Axios            | Latest  | HTTP client              |
| Zod              | Latest  | Schema validation        |
| Bcrypt           | Latest  | Password hashing         |
| Helmet           | Latest  | Security headers         |

---

**Document Maintained By:** Development Team
**Last Review:** October 7, 2025
**Next Review:** November 7, 2025
