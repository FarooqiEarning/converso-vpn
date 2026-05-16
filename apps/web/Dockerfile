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

COPY --from=builder --chown=nodejs:nodejs /app/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/.next ./.next
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nodejs:nodejs /app/.next.zi[p] ./

USER nodejs

EXPOSE 3001

ENV NODE_ENV=production

CMD ["npm", "start"]