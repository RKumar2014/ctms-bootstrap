# Build stage - compile TypeScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage - minimal image
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

# Cloud Run uses PORT env variable
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
