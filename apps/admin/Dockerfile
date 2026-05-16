# Converso VPN - Admin Panel Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY . .
RUN npm install -g turbo
RUN npm ci
RUN npm run build

# Production
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app/apps/admin/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/apps/admin/.next ./.next
COPY --from=builder --chown=nodejs:nodejs /app/apps/admin/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/apps/admin/package.json ./

USER nodejs

EXPOSE 3002

CMD ["npm", "start"]