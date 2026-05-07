# =========================
# Stage 1: Dependencies
# =========================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

# Use npm install for safety (works without package-lock.json)
RUN npm install --omit=dev && npm cache clean --force


# =========================
# Stage 2: Production
# =========================
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user (security best practice)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy app source code
COPY src ./src
COPY package.json ./

# Fix ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# =========================
# Health Check
# =========================
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# =========================
# Expose port
# =========================
EXPOSE 3000

# =========================
# Start app
# =========================
CMD ["node", "src/index.js"]