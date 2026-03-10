# Multi-stage Dockerfile for admin-service
# TODO: Update NODE_ENV and build args as needed

# ─── Stage 1: Production dependencies ────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable
RUN pnpm install --frozen-lockfile --prod

# ─── Stage 2: Builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN npx nx build admin-service --prod

# ─── Stage 3: Runner ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nestjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist/apps/admin-service ./dist

USER nestjs

EXPOSE 6006

# TODO: Adjust main.js path if Nx output structure differs
CMD ["node", "dist/main.js"]
