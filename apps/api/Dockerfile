# Converso VPN - API Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies from root package.json (contains all API deps)
COPY package*.json ./
RUN npm install --omit=dev

# Copy API-specific config files to /app (where nest expects them)
COPY apps/api/tsconfig.json apps/api/nest-cli.json ./

# Copy API source code
COPY apps/api/src ./src

# Build NestJS directly — turbo cannot discover workspaces in this partial-copy context
RUN npm install -g @nestjs/cli
RUN nest build

# Production
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/v1', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/main.js"]