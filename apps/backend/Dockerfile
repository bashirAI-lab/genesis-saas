FROM node:18-alpine AS builder

WORKDIR /app

# Copy root manifest and workspaces
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/ ./packages/shared/

# Install dependencies
RUN npm ci

# Copy source
COPY apps/backend/ ./apps/backend/

# Build backend
WORKDIR /app/apps/backend
RUN npm run build

# --- Production Image ---
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/packages/shared/ ./packages/shared/

# Install production dependencies
RUN npm install --production

# Copy built assets
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/.env* ./apps/backend/

WORKDIR /app/apps/backend

EXPOSE 3001

CMD ["node", "dist/main"]
