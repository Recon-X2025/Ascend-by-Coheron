# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps ./apps
COPY packages ./packages

RUN npm ci 2>/dev/null || npm install

# Prisma generate (from database package)
WORKDIR /app/packages/database
RUN npx prisma generate

WORKDIR /app
RUN npm run build:packages 2>/dev/null || true
RUN npm run build:api 2>/dev/null || (cd apps/api && npx tsc -p tsconfig.json) || true
RUN npm run build:web 2>/dev/null || (cd apps/web && npx vite build) || true

# Merge web build into api dist for serving SPA
RUN cp -r apps/web/dist/* apps/api/dist/ 2>/dev/null || true

# Production stage: run API (serves API + SPA from dist)
FROM node:20-alpine

WORKDIR /app

# Copy root package and lock
COPY package.json package-lock.json* ./
# Copy workspace packages (needed for @ascend/* resolution)
COPY --from=builder /app/packages ./packages
# Copy built API dist (includes merged SPA)
COPY --from=builder /app/apps/api/dist ./dist
# Install production deps at root so workspace deps resolve
RUN npm ci --omit=dev 2>/dev/null || npm install --production

ENV NODE_ENV=production
EXPOSE 3000

# Run from /app; server listens on PORT and serves /api and static from dist (tsx loads workspace TS packages)
CMD ["npx", "tsx", "dist/server.js"]
