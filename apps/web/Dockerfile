# Converso VPN - Web Dashboard Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install -g turbo
RUN npm install --omit=dev

COPY . .
RUN npm run build

# Production
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /apps/web/public ./public
COPY --from=builder --chown=nodejs:nodejs /apps/web/.next ./.next
COPY --from=builder --chown=nodejs:nodejs /apps/web/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /apps/web/package.json ./
COPY --from=builder --chown=nodejs:nodejs /apps/web/next.config.js ./
COPY --from=builder --chown=nodejs:nodejs /apps/web/.next.zi[p] ./

USER nodejs

EXPOSE 3001

ENV NODE_ENV=production

CMD ["npm", "start"]