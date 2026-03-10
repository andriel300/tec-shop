# Multi-stage Dockerfile for admin-ui (Next.js)
# TODO: Update NEXT_PUBLIC_* build args as needed

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

# TODO: Pass NEXT_PUBLIC_ env vars as build args if needed at build time
# ARG NEXT_PUBLIC_API_URL
# ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npx nx build admin-ui --prod

# ─── Stage 3: Runner ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy Next.js standalone output
# TODO: Enable output: 'standalone' in next.config.js for smaller image
COPY --from=builder /app/dist/apps/admin-ui/.next/standalone ./
COPY --from=builder /app/dist/apps/admin-ui/.next/static ./.next/static
COPY --from=builder /app/dist/apps/admin-ui/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
