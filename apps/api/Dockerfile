# Converso VPN - API Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy everything to allow turbo to discover workspaces
COPY . .

# Install all dependencies (including devDependencies needed for build)
RUN npm install -g turbo
RUN npm install

# Build the api package using turbo
RUN turbo run build --filter=@converso-vpn/api

# Production
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

# Copy compiled dist from the workspace
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./dist

# Copy migrations folder
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/src/migrations ./src/migrations

# Copy hoisted node_modules from root
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy workspace node_modules (if any unhoisted dependencies exist, copy them safely)
# We use a wildcard so it doesn't fail if the directory doesn't exist
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/node_module[s] ./apps/api/node_modules

# Copy API package.json
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package*.json ./

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/v1', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/main.js"]