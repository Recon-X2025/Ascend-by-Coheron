# Ascend by Coheron — production image (Node server serves API + built SPA)
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and config
COPY . .
COPY prisma ./prisma/

# Generate Prisma client (migrations run separately via prisma migrate deploy)
RUN npx prisma generate

# Build frontend (dist/) and server (dist/server.js)
RUN npm run build && npm run build:server

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production deps only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy Prisma schema and generated client for runtime
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/server.js"]
