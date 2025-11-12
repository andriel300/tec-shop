# NestJS Microservices Guide for TecShop

A comprehensive guide for newcomers to understand and work with the NestJS microservices architecture in this project.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Creating a New API Endpoint](#creating-a-new-api-endpoint)
4. [Frontend Integration](#frontend-integration)
5. [Common Patterns](#common-patterns)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### What is a Microservices Architecture?

This project uses a **microservices architecture** where the application is split into multiple independent services that communicate with each other. Each service has its own database and business logic.

```
┌─────────────┐
│  User-UI    │ (Next.js Frontend)
└──────┬──────┘
       │
       │ HTTP REST API
       ▼
┌─────────────────┐
│  API Gateway    │ (Port 8080)
│  (REST API)     │
└────────┬────────┘
         │
         │ TCP Microservices
         ▼
┌────────────────────────────────────────┐
│  auth-service   │ user-service         │
│  (Port 6001)    │ (Port 6002)          │
│                 │                      │
│  seller-service │ product-service      │
│  (Port 6003)    │ (Port 6004)          │
└────────────────────────────────────────┘
```

### Key Components

1. **API Gateway** (`apps/api-gateway/`)

   - Exposes REST API endpoints to the frontend
   - Handles HTTP requests, authentication, file uploads
   - Forwards requests to microservices via TCP
   - Uses `@Get()`, `@Post()`, `@Put()`, `@Delete()` decorators

2. **Microservices** (`apps/auth-service/`, `apps/user-service/`, etc.)

   - Handle specific business logic (auth, users, sellers, products)
   - Listen for messages via TCP transport
   - Use `@MessagePattern()` decorator
   - Each has its own Prisma database schema

3. **Shared Libraries**
   - `libs/shared/dto/` - Data Transfer Objects (DTOs) shared across services
   - `libs/prisma-clients/` - Generated Prisma clients per service
   - `libs/prisma-schemas/` - Prisma schemas per service

---

## Project Structure

```
tec-shop/
├── apps/
│   ├── api-gateway/          # REST API Gateway (HTTP)
│   │   └── src/
│   │       └── app/
│   │           ├── auth/     # Auth endpoints
│   │           ├── user/     # User endpoints
│   │           ├── seller/   # Seller endpoints
│   │           └── product/  # Product endpoints
│   │
│   ├── auth-service/         # Auth microservice (TCP)
│   │   └── src/
│   │       └── app/
│   │           └── auth/
│   │               ├── auth.controller.ts  # @MessagePattern handlers
│   │               └── auth.service.ts     # Business logic
│   │
│   ├── user-service/         # User microservice (TCP)
│   ├── seller-service/       # Seller microservice (TCP)
│   ├── product-service/      # Product microservice (TCP)
│   │
│   └── user-ui/              # Next.js Frontend
│       └── src/
│           ├── lib/api/      # API client functions
│           ├── hooks/        # React Query hooks
│           └── app/          # Next.js pages
│
└── libs/
    ├── shared/dto/           # Shared DTOs
    ├── prisma-schemas/       # Database schemas
    └── prisma-clients/       # Generated Prisma clients
```

---

## Creating a New API Endpoint

Let's walk through a complete example: **Creating a "Get User Wishlist" endpoint**.

### Step 1: Define the DTO (Data Transfer Object)

DTOs define the shape of data being transferred between services.

**File**: `libs/shared/dto/src/lib/user/wishlist.dto.ts`

```typescript
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class GetWishlistDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

export class WishlistResponseDto {
  items: WishlistItemDto[];
  total: number;
  limit: number;
  offset: number;
}

export class WishlistItemDto {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  productImage: string;
  addedAt: Date;
}
```

**Export it** in `libs/shared/dto/src/index.ts`:

```typescript
// Add to existing exports
export * from './lib/user/wishlist.dto';
```

### Step 2: Create Service Method (Business Logic)

The service contains the actual business logic and database operations.

**File**: `apps/user-service/src/app/user/user.service.ts`

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserPrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: UserPrismaService) {}

  // ... existing methods ...

  /**
   * Get user's wishlist with pagination
   */
  async getWishlist(payload: { userId: string; limit?: number; offset?: number }) {
    try {
      this.logger.debug(`Fetching wishlist for userId: ${payload.userId}`);

      // Check if user exists
      const userProfile = await this.prisma.userProfile.findUnique({
        where: { userId: payload.userId },
      });

      if (!userProfile) {
        throw new NotFoundException('User profile not found');
      }

      // Set pagination defaults
      const limit = payload.limit && payload.limit > 0 ? payload.limit : 20;
      const offset = payload.offset && payload.offset >= 0 ? payload.offset : 0;

      // Build where clause
      const where = {
        userProfileId: userProfile.id,
      };

      // Execute query with pagination
      const [items, total] = await Promise.all([
        this.prisma.wishlistItem.findMany({
          where,
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                images: true,
              },
            },
          },
          take: limit,
          skip: offset,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.wishlistItem.count({ where }),
      ]);

      this.logger.log(`Found ${items.length} wishlist items out of ${total}`);

      // Transform to DTO format
      const wishlistItems = items.map((item) => ({
        id: item.id,
        productId: item.product.id,
        productTitle: item.product.title,
        productPrice: item.product.price,
        productImage: item.product.images[0] || '',
        addedAt: item.createdAt,
      }));

      return {
        items: wishlistItems,
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch wishlist: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
```

### Step 3: Create Microservice Controller Handler (Message Pattern)

The microservice controller listens for messages via TCP.

**File**: `apps/user-service/src/app/user/user.controller.ts`

```typescript
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import type { GetWishlistDto } from '@tec-shop/dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ... existing message patterns ...

  /**
   * Get user wishlist
   * Message pattern: 'get-user-wishlist'
   */
  @MessagePattern('get-user-wishlist')
  async getWishlist(@Payload() payload: GetWishlistDto) {
    return this.userService.getWishlist(payload);
  }
}
```

### Step 4: Create API Gateway Controller (REST Endpoint)

The API Gateway exposes a REST endpoint that calls the microservice.

**File**: `apps/api-gateway/src/app/user/user.controller.ts`

```typescript
import { Controller, Get, Query, Req, UseGuards, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';

@ApiTags('User')
@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(@Inject('USER_SERVICE') private readonly userService: ClientProxy) {}

  // ... existing endpoints ...

  /**
   * Get user's wishlist
   * GET /user/wishlist
   */
  @Get('wishlist')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user wishlist' })
  @ApiResponse({ status: 200, description: 'Wishlist retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User profile not found' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getWishlist(@Req() req: Request & { user: { userId: string } }, @Query('limit') limitStr?: string, @Query('offset') offsetStr?: string) {
    const userId = req.user.userId;

    // Parse query parameters
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    const offset = offsetStr ? parseInt(offsetStr, 10) : undefined;

    this.logger.log(`Fetching wishlist for user: ${userId}`);

    // Send message to user-service microservice
    const response = await firstValueFrom(
      this.userService.send('get-user-wishlist', {
        userId,
        limit,
        offset,
      })
    );

    return response;
  }
}
```

### Step 5: Verify Module Registration

Make sure the controller is registered in the module.

**File**: `apps/api-gateway/src/app/user/user.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserController } from './user.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.USER_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.USER_SERVICE_PORT || '6002', 10),
        },
      },
    ]),
  ],
  controllers: [UserController],
})
export class UserModule {}
```

### Step 6: Test the Endpoint

Run type checking and test the endpoint:

```bash
# Type check all services
npx nx typecheck user-service
npx nx typecheck api-gateway

# Start services
npm run dev

# Test with curl (after getting JWT token)
curl -X GET "http://localhost:8080/user/wishlist?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Frontend Integration

Now let's integrate this API into the Next.js frontend.

### Step 1: Create API Client Function

**File**: `apps/user-ui/src/lib/api/wishlist.ts`

```typescript
import { apiClient } from './client';

export interface WishlistItem {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  productImage: string;
  addedAt: Date;
}

export interface WishlistResponse {
  items: WishlistItem[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Fetch user's wishlist
 */
export const getWishlist = async (params?: { limit?: number; offset?: number }): Promise<WishlistResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }

  if (params?.offset) {
    queryParams.append('offset', params.offset.toString());
  }

  const url = `/user/wishlist${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const response = await apiClient.get<WishlistResponse>(url);
  return response.data;
};

/**
 * Add product to wishlist
 */
export const addToWishlist = async (productId: string): Promise<void> => {
  await apiClient.post('/user/wishlist', { productId });
};

/**
 * Remove product from wishlist
 */
export const removeFromWishlist = async (itemId: string): Promise<void> => {
  await apiClient.delete(`/user/wishlist/${itemId}`);
};
```

### Step 2: Create React Query Hook

**File**: `apps/user-ui/src/hooks/use-wishlist.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWishlist, addToWishlist, removeFromWishlist } from '../lib/api/wishlist';
import type { WishlistResponse } from '../lib/api/wishlist';

/**
 * Hook to fetch user's wishlist
 */
export const useWishlist = (params?: { limit?: number; offset?: number }) => {
  return useQuery<WishlistResponse>({
    queryKey: ['wishlist', params],
    queryFn: () => getWishlist(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to add product to wishlist
 */
export const useAddToWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => addToWishlist(productId),
    onSuccess: () => {
      // Invalidate wishlist queries to refetch
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
};

/**
 * Hook to remove product from wishlist
 */
export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => removeFromWishlist(itemId),
    onSuccess: () => {
      // Invalidate wishlist queries to refetch
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
};
```

### Step 3: Use in React Component

**File**: `apps/user-ui/src/app/(routes)/wishlist/page.tsx`

```typescript
'use client';

import React from 'react';
import { useWishlist, useRemoveFromWishlist } from '../../../hooks/use-wishlist';
import Image from 'next/image';

export default function WishlistPage() {
  const { data: wishlist, isLoading, error } = useWishlist({ limit: 20, offset: 0 });
  const removeFromWishlist = useRemoveFromWishlist();

  const handleRemove = async (itemId: string) => {
    try {
      await removeFromWishlist.mutateAsync(itemId);
      // Success feedback
      alert('Item removed from wishlist');
    } catch (error) {
      console.error('Failed to remove item:', error);
      alert('Failed to remove item from wishlist');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading wishlist...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-red-500">Error loading wishlist</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>

      {wishlist && wishlist.items.length === 0 ? (
        <p className="text-gray-500">Your wishlist is empty</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {wishlist?.items.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 shadow-sm">
              {item.productImage && <Image src={item.productImage} alt={item.productTitle} width={300} height={300} className="w-full h-48 object-cover rounded mb-4" />}

              <h3 className="text-lg font-semibold mb-2">{item.productTitle}</h3>
              <p className="text-xl font-bold text-brand-primary mb-4">${item.productPrice.toFixed(2)}</p>

              <button onClick={() => handleRemove(item.id)} disabled={removeFromWishlist.isPending} className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50">
                {removeFromWishlist.isPending ? 'Removing...' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}

      {wishlist && wishlist.total > wishlist.limit && (
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Showing {wishlist.items.length} of {wishlist.total} items
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## Common Patterns

### 1. Authentication & Authorization

#### Protecting Endpoints with JWT

**API Gateway**:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

@Controller('admin')
export class AdminController {
  // Public endpoint - no authentication required
  @Get('health')
  healthCheck() {
    return { status: 'ok' };
  }

  // Protected endpoint - requires authentication
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getProfile(@Req() req: Request & { user: { userId: string } }) {
    return { userId: req.user.userId };
  }

  // Admin-only endpoint - requires ADMIN role
  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  createUser(@Body() createUserDto: CreateUserDto) {
    // Only users with ADMIN role can access this
  }

  // Seller-only endpoint
  @Post('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  createProduct(@Body() createProductDto: CreateProductDto) {
    // Only users with SELLER role can access this
  }

  // Multiple roles allowed
  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  @ApiBearerAuth()
  getDashboard() {
    // Both ADMIN and SELLER can access this
  }
}
```

#### Frontend Authentication

```typescript
// Using API client with automatic JWT handling
import { apiClient } from '../lib/api/client';

// Login
const response = await apiClient.post('/auth/login', {
  email: 'user@example.com',
  password: 'password123',
});

// JWT is automatically stored in httpOnly cookie
// All subsequent requests include the JWT automatically

// Protected API call
const userData = await apiClient.get('/user/profile');
```

### 2. File Upload Pattern

#### Backend (API Gateway)

```typescript
import { UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ImageKitService } from '@tec-shop/shared/imagekit';

@Controller('products')
export class ProductController {
  constructor(private readonly imageKitService: ImageKitService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @UseInterceptors(FilesInterceptor('images', 4)) // Max 4 images
  @ApiConsumes('multipart/form-data')
  async createProduct(@UploadedFiles() files: Array<Express.Multer.File>, @Body() createProductDto: CreateProductDto, @Req() req: Request & { user: { userId: string } }) {
    // Validate files
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    // Upload to ImageKit
    const imageUrls: string[] = [];
    for (const file of files) {
      const uploadResult = await this.imageKitService.uploadFile({
        file: file.buffer,
        fileName: file.originalname,
        folder: '/products',
      });
      imageUrls.push(uploadResult.url);
    }

    // Send to microservice with image URLs
    const response = await firstValueFrom(
      this.productService.send('create-product', {
        ...createProductDto,
        images: imageUrls,
        sellerId: req.user.userId,
      })
    );

    return response;
  }
}
```

#### Frontend (React)

```typescript
'use client';

import { useState } from 'react';
import { apiClient } from '../lib/api/client';

export default function CreateProductForm() {
  const [images, setImages] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create FormData
    const formData = new FormData();
    formData.append('title', 'Product Title');
    formData.append('price', '99.99');
    formData.append('description', 'Product description');

    // Append images
    images.forEach((image) => {
      formData.append('images', image);
    });

    try {
      const response = await apiClient.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Product created successfully');
    } catch (error) {
      console.error('Failed to create product:', error);
      alert('Failed to create product');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" multiple accept="image/*" onChange={(e) => setImages(Array.from(e.target.files || []))} />
      <button type="submit">Create Product</button>
    </form>
  );
}
```

### 3. Inter-Service Communication

Services can call other services directly using TCP.

**Example**: Product service verifying shop ownership via seller service

```typescript
// apps/product-service/src/app/product/product.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProductService {
  constructor(@Inject('SELLER_SERVICE') private readonly sellerService: ClientProxy, private prisma: ProductPrismaService) {}

  async createProduct(sellerId: string, shopId: string, productData: CreateProductDto) {
    // Verify that the seller owns the shop
    const ownsShop = await firstValueFrom(
      this.sellerService.send('seller-verify-shop-ownership', {
        sellerId,
        shopId,
      })
    );

    if (!ownsShop) {
      throw new ForbiddenException('You do not own this shop');
    }

    // Create product
    const product = await this.prisma.product.create({
      data: {
        ...productData,
        shopId,
        sellerId,
      },
    });

    return product;
  }
}
```

**Register the client** in module:

```typescript
// apps/product-service/src/app/product/product.module.ts

import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'SELLER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.SELLER_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.SELLER_SERVICE_PORT || '6003', 10),
        },
      },
    ]),
  ],
  // ...
})
export class ProductModule {}
```

### 4. Pagination Pattern

Standard pagination pattern used across all endpoints:

**Backend**:

```typescript
async getProducts(filters: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}) {
  // Set defaults
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
  const offset = filters.offset && filters.offset >= 0 ? filters.offset : 0;

  // Build where clause
  const where: Record<string, unknown> = { isActive: true };

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) {
      where.price.gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      where.price.lte = filters.maxPrice;
    }
  }

  // Execute with pagination
  const [items, total] = await Promise.all([
    this.prisma.product.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    limit,
    offset,
    hasMore: offset + items.length < total,
  };
}
```

**Frontend**:

```typescript
const { data, isLoading } = useProducts({
  category: 'electronics',
  limit: 20,
  offset: 0,
});

// Pagination controls
const totalPages = Math.ceil(data.total / data.limit);
const currentPage = Math.floor(data.offset / data.limit) + 1;
```

---

## Best Practices

### 1. Always Use TypeScript Types

```typescript
// Bad - using any
const product: any = await getProduct(id);

// Good - proper typing
const product: Product = await getProduct(id);
```

### 2. Use NestJS Logger (Not console.log)

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  async doSomething() {
    this.logger.log('Starting operation');
    this.logger.debug('Debug info', { data: 'value' });
    this.logger.error('Error occurred', error.stack);
  }
}
```

### 3. Validate Input with DTOs

```typescript
import { IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  title: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
```

### 4. Handle Errors Properly

```typescript
import { NotFoundException, BadRequestException } from '@nestjs/common';

async getProduct(id: string) {
  const product = await this.prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new NotFoundException(`Product with ID ${id} not found`);
  }

  if (!product.isActive) {
    throw new BadRequestException('Product is not available');
  }

  return product;
}
```

### 5. Use React Query for Data Fetching (Frontend)

```typescript
// Bad - using useEffect
useEffect(() => {
  fetch('/api/products')
    .then((res) => res.json())
    .then((data) => setProducts(data));
}, []);

// Good - using React Query
const { data: products, isLoading, error } = useProducts();
```

### 6. Environment Variables

All environment variables should be in the root `.env` file:

```env
# Database
DATABASE_URL="mongodb://localhost:27017/tec-shop"

# JWT
JWT_SECRET="your-very-secure-secret-at-least-32-characters-long"

# Service Communication
SERVICE_MASTER_SECRET="another-secure-secret-for-service-to-service"

# Microservice Ports
AUTH_SERVICE_PORT=6001
USER_SERVICE_PORT=6002
SELLER_SERVICE_PORT=6003
PRODUCT_SERVICE_PORT=6004

# ImageKit
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your-id"
IMAGEKIT_PUBLIC_KEY="your-public-key"
IMAGEKIT_PRIVATE_KEY="your-private-key"
```

### 7. Swagger Documentation

Always document your API endpoints:

```typescript
@ApiOperation({ summary: 'Create a new product' })
@ApiResponse({ status: 201, description: 'Product created successfully' })
@ApiResponse({ status: 400, description: 'Invalid input' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 403, description: 'Forbidden - not a seller' })
@ApiBearerAuth()
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
async createProduct(@Body() createProductDto: CreateProductDto) {
  // Implementation
}
```

Access Swagger UI at: `http://localhost:8080/api-docs`

---

## Troubleshooting

### Issue 1: "Cannot find name 'ApiQuery'" or similar decorator errors

**Problem**: Missing import in controller

**Solution**:

```typescript
import { ApiQuery, ApiOperation, ApiResponse } from '@nestjs/swagger';
```

### Issue 2: "Microservice not responding" or timeout errors

**Problem**: Microservice not running or wrong port

**Solution**:

```bash
# Check if service is running
npx nx serve user-service

# Check .env for correct ports
USER_SERVICE_PORT=6002
```

### Issue 3: "localStorage is not defined" or SSR errors

**Problem**: Accessing browser APIs during server-side rendering

**Solution**:

```typescript
// Add window check
if (typeof window !== 'undefined') {
  localStorage.setItem('key', 'value');
}

// Or use useEffect
useEffect(() => {
  localStorage.setItem('key', 'value');
}, []);
```

### Issue 4: "Module not found" when importing from @tec-shop/\*

**Problem**: Shared library not built or path mapping incorrect

**Solution**:

```bash
# Rebuild shared libraries
npx nx run-many --target=build --all

# Check tsconfig.json paths
{
  "paths": {
    "@tec-shop/dto": ["libs/shared/dto/src/index.ts"]
  }
}
```

### Issue 5: Prisma Client not found

**Problem**: Prisma client not generated

**Solution**:

```bash
# Generate all Prisma clients
npm run prisma:generate

# Or specific service
npx prisma generate --schema=libs/prisma-schemas/user-schema/prisma/schema.prisma
```

### Issue 6: CORS errors in frontend

**Problem**: Frontend and backend on different origins

**Solution**: Check CORS configuration in `apps/api-gateway/src/main.ts`:

```typescript
app.enableCors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
});
```

### Issue 7: "Unauthorized" even with valid token

**Problem**: JWT not being sent or expired

**Solution**:

```typescript
// Check if token is in cookies (httpOnly)
// Or send in Authorization header
const response = await apiClient.get('/user/profile', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Check token expiration
const decoded = jwtDecode(token);
console.log('Token expires at:', new Date(decoded.exp * 1000));
```

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev                          # Start all services
npx nx serve api-gateway             # Start API Gateway only
npx nx serve user-service            # Start user service only
npm run user-ui                      # Start user frontend

# Build & Test
npx nx build <service-name>          # Build service
npx nx test <service-name>           # Run tests
npx nx lint <service-name>           # Lint code
npx nx typecheck <service-name>      # Type check

# Database
npm run prisma:generate              # Generate Prisma clients
npm run prisma:db-push               # Push schema to database
npm run prisma:studio                # Open Prisma Studio GUI

# All Services
npx nx run-many --target=build --all
npx nx run-many --target=test --all
```

### Important File Locations

| Purpose                  | Location                                |
| ------------------------ | --------------------------------------- |
| DTOs                     | `libs/shared/dto/src/lib/`              |
| Prisma Schemas           | `libs/prisma-schemas/<service>-schema/` |
| API Gateway Controllers  | `apps/api-gateway/src/app/*/`           |
| Microservice Controllers | `apps/<service>/src/app/*/`             |
| Frontend API Clients     | `apps/user-ui/src/lib/api/`             |
| React Query Hooks        | `apps/user-ui/src/hooks/`               |
| Guards                   | `apps/api-gateway/src/guards/`          |
| Environment Variables    | `.env` (root)                           |

### Decorator Quick Reference

| Decorator                  | Usage                   | Location           |
| -------------------------- | ----------------------- | ------------------ |
| `@Get()`, `@Post()`, etc.  | REST endpoints          | API Gateway only   |
| `@MessagePattern()`        | TCP message handler     | Microservices only |
| `@UseGuards(JwtAuthGuard)` | Require authentication  | API Gateway        |
| `@Roles('ADMIN')`          | Require specific role   | API Gateway        |
| `@ApiTags()`               | Swagger tag             | API Gateway        |
| `@ApiBearerAuth()`         | Swagger JWT auth        | API Gateway        |
| `@Payload()`               | Get TCP message payload | Microservices      |
| `@Body()`                  | Get HTTP request body   | API Gateway        |
| `@Query()`                 | Get URL query params    | API Gateway        |
| `@Param()`                 | Get URL path params     | API Gateway        |

---

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Next.js Documentation](https://nextjs.org/docs)
- [Swagger/OpenAPI Documentation](https://swagger.io/docs/)

---
