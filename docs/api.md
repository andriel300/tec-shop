# API Documentation

The API is fully documented with Swagger/OpenAPI. Access the interactive documentation at:

- Development: http://localhost:8080/api-docs
- Production: https://api.tec-shop.com/api-docs

## Endpoint Groups

| Group           | Base Path              | Auth Required    |
| --------------- | ---------------------- | ---------------- |
| Authentication  | `/api/auth`            | Varies           |
| User Profiles   | `/api/user`            | JWT              |
| Sellers         | `/api/seller`          | JWT + SELLER     |
| Shops           | `/api/shops`           | Varies           |
| Products        | `/api/products`        | Varies           |
| Categories      | `/api/categories`      | Admin write      |
| Brands          | `/api/brands`          | Admin write      |
| Orders          | `/api/orders`          | JWT              |
| Admin           | `/api/admin`           | JWT + ADMIN      |
| Chat            | `/api/chat`            | JWT              |
| Recommendations | `/api/recommendations` | JWT              |
| Webhooks        | `/api/webhooks/stripe` | Stripe signature |

## WebSocket Endpoints

Browser clients connect directly to the WebSocket services (not through the API Gateway):

| Service              | Dev URL                   | Production URL                  |
| -------------------- | ------------------------- | ------------------------------- |
| Chatting service     | `http://localhost:6007`   | `wss://chat.tec-shop.com`       |
| Notification service | `http://localhost:6012`   | `wss://notify.tec-shop.com`     |

Configure production URLs via `NEXT_PUBLIC_CHATTING_WS_URL` and `NEXT_PUBLIC_NOTIFICATION_WS_URL`.
