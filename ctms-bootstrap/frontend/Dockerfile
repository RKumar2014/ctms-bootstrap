# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Hardcode the production API URL for the build
# This gets baked into the JavaScript bundle at build time
ENV VITE_API_URL=https://ctms-backend-727328933272.us-central1.run.app

RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA-friendly nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
