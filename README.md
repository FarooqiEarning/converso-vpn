# Converso VPN

Production-grade commercial VPN platform with centralized orchestration, billing, and custom WireGuard control plane.

## Features

- JWT + Google OAuth authentication
- WireGuard peer management with QR codes
- Stripe billing integration
- Real-time node health monitoring
- Prometheus metrics
- Dark theme with glassmorphism UI
- Multi-region VPN nodes support

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env

# Start local development
docker compose up -d

# Access services
# API: http://localhost:3000
# Web: http://localhost:3001
# Swagger: http://localhost:3000/api/docs
# Grafana: http://localhost:3002
# Prometheus: http://localhost:9090
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete production deployment instructions.

### Quick Deployment Steps

1. **DNS Setup** - Create A records for:
   - `api.vpn.conversoempire.world` → Your server IP
   - `app.vpn.conversoempire.world` → Your server IP
   - `admin.vpn.conversoempire.world` → Your server IP

2. **Deploy Control Plane**:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   docker compose -f docker compose.prod.yml up -d
   ```

3. **Deploy VPN Nodes**:
   ```bash
   ./deploy-node.sh sg1 <node-id> <server-ip> <secret> <api-url>
   ```

## Project Structure

```
converso-vpn/
├── apps/
│   ├── api/           # NestJS Control Plane API
│   ├── web/           # Next.js Customer Dashboard
│   ├── admin/         # Next.js Admin Panel
│   └── node-agent/    # GoLang VPN Node Agent
├── packages/
│   ├── types/         # Shared TypeScript types
│   └── validators/    # Shared Zod schemas
├── infrastructure/
│   ├── nginx/         # Nginx configuration
│   └── ssl/          # SSL certificates
├── monitoring/
│   ├── prometheus/   # Prometheus config
│   └── grafana/      # Grafana dashboards
├── docker compose.yml        # Development
├── docker compose.prod.yml   # Production
├── DEPLOYMENT.md            # Full deployment guide
└── QUICK-REF.md             # Quick reference
```

## Required Domains

| Domain | Purpose |
|--------|---------|
| api.vpn.conversoempire.world | Control Plane API |
| app.vpn.conversoempire.world | Customer Dashboard |
| admin.vpn.conversoempire.world | Admin Panel |
| {location}{n}.vpn.conversoempire.world | VPN Nodes |

## Required Environment Variables

```bash
# Database
DATABASE_PASSWORD=your_strong_password

# JWT (64+ character random strings)
JWT_ACCESS_SECRET=generate_64_char_random_string
JWT_REFRESH_SECRET=generate_64_char_random_string

# Encryption (32 bytes, base64)
ENCRYPTION_KEY=openssl_rand_base64_32

# Node Agent
NODE_AGENT_SECRET=your_agent_secret

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| API | 3000 | NestJS REST API |
| Web | 3001 | Next.js Dashboard |
| Nginx | 80/443 | Reverse Proxy |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |
| Prometheus | 9090 | Metrics |
| Grafana | 3002 | Dashboards |

## Tech Stack

- **API**: NestJS + TypeORM + PostgreSQL
- **Web**: Next.js 14 + Tailwind + Zustand
- **Node Agent**: GoLang + WireGuard
- **Monitoring**: Prometheus + Grafana
- **Gateway**: Nginx

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [QUICK-REF.md](./QUICK-REF.md) - Quick reference card
- [converso-vpn-system-design.md](./converso-vpn-system-design.md) - System architecture

## License

Proprietary - All rights reserved