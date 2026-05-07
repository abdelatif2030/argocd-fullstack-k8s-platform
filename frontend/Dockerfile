# =========================
# Stage 1: Build
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# FIX: use npm install instead of npm ci (no lockfile required)
RUN npm install

# Copy source
COPY . .

# Build app
RUN npm run build


# =========================
# Stage 2: Production (Nginx)
# =========================
FROM nginx:alpine AS production

# Copy nginx config (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output (React = build, Vite = dist)
COPY --from=builder /app/build /usr/share/nginx/html

# =========================
# Security hardening
# =========================
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 && \
    chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chown -R appuser:appgroup /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 80

# =========================
# Healthcheck
# =========================
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# =========================
# Run Nginx
# =========================
CMD ["nginx", "-g", "daemon off;"]