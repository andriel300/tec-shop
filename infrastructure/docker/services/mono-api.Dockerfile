# Multi-stage Dockerfile for mono-api
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
RUN npx nx build mono-api --prod

# ─── Stage 3: Runner ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nestjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

USER nestjs

EXPOSE 8080

CMD ["node", "dist/main.js"]
