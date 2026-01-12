# Stage 1: Build AnkaReport
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build API
FROM node:20 AS api-builder
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY api/package*.json ./api/
RUN cd api && npm ci
COPY api ./api
RUN cd api && npm run build
# Copy public assets (index.html template) to dist
RUN mkdir -p api/dist/public && cp -r api/public/* api/dist/public/ 2>/dev/null || true

# Stage 3: Runtime
FROM mcr.microsoft.com/playwright:v1.40.0-focal
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=api-builder /app/api/dist ./api/dist
COPY --from=api-builder /app/api/package*.json ./api/
RUN cd api && npm ci --production
EXPOSE 3000
CMD ["node", "api/dist/server.js"]
