# Stage 1: Build AnkaReport
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build API
FROM node:20-alpine AS api-builder
WORKDIR /app
COPY --from=builder /app/dist ./library-dist
COPY api ./api
# Copy library assets to api public libs before build
RUN mkdir -p api/public/libs && cp -r library-dist/* api/public/libs/
RUN cd api && npm ci
RUN cd api && npm run build
# Copy public assets (index.html template and libs) to dist
RUN mkdir -p api/dist/public && cp -r api/public/* api/dist/public/ 2>/dev/null || true

# Stage 3: Runtime (minimal Playwright with Chromium only)
# Using jammy (Ubuntu 22.04) which is slightly more optimized
FROM mcr.microsoft.com/playwright:v1.57.0-jammy

# Remove Firefox and WebKit browser binaries to save space
RUN rm -rf /ms-playwright/firefox-* /ms-playwright/webkit-* 2>/dev/null || true

WORKDIR /app

# Copy only necessary files
COPY --from=builder /app/dist ./dist
COPY --from=api-builder /app/api/dist ./api/dist
COPY --from=api-builder /app/api/package*.json ./api/

# Install production dependencies only and clean cache
RUN cd api && npm ci --omit=dev && npm cache clean --force

EXPOSE 3000
CMD ["node", "api/dist/server.js"]
