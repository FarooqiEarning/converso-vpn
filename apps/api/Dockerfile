# Converso VPN - API Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install -g turbo
RUN npm install --omit=dev

COPY apps/api/tsconfig.json apps/api/nest-cli.json ./
COPY apps/api/src ./src
COPY turbo.json ./

RUN npm run build

# Production
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /apps/api/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /apps/api/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /apps/api/package*.json ./

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e require('http').get('http://localhost:3000/v1', (r) => process.exit(r.statusCode === 200 ? 0 : 1))

CMD ["node", "dist/main.js"]