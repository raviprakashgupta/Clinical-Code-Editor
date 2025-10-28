## Multi-stage Dockerfile for building and serving the Vite app
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies (use npm ci for reproducible builds if package-lock.json exists)
COPY package.json package-lock.json* ./
RUN npm install --production=false

# Copy source and build
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
