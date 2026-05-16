# Quick Reference - Converso VPN

## Domain Summary

| Domain | Service | Port |
|--------|---------|------|
| api.vpn.conversoempire.world | API | 443 |
| app.vpn.conversoempire.world | Web App | 443 |
| admin.vpn.conversoempire.world | Admin | 443 |
| sg1.vpn.conversoempire.world | VPN Node SG | 51820/UDP |
| jp1.vpn.conversoempire.world | VPN Node JP | 51820/UDP |
| us1.vpn.conversoempire.world | VPN Node US | 51820/UDP |

## Port Reference

### Main Server
| Port | Service |
|------|---------|
| 22 | SSH |
| 80 | HTTP (Nginx) |
| 443 | HTTPS (Nginx) |
| 3000 | API (internal) |
| 3001 | Web (internal) |
| 3002 | Grafana |
| 5432 | PostgreSQL |
| 6379 | Redis |
| 9090 | Prometheus |

### VPN Nodes
| Port | Service |
|------|---------|
| 22 | SSH |
| 51820 | WireGuard UDP |
| 9100 | Node Agent Metrics |
| 50051 | Node Agent gRPC |

## Common Commands

```bash
# Deploy main server
docker compose -f docker compose.prod.yml up -d

# Deploy VPN node
./deploy-node.sh <name> <id> <ip> <secret> <url>

# Check status
docker compose ps

# View logs
docker logs converso-api
docker logs converso-web

# Restart service
docker compose restart api

# Database backup
docker exec converso-postgres pg_dump -U converso_user converso_vpn > backup.sql
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/auth/register | Register user |
| POST | /v1/auth/login | Login |
| GET | /v1/nodes | List VPN nodes |
| GET | /v1/devices | List user devices |
| POST | /v1/devices | Create device |
| GET | /v1/subscriptions/plans | List plans |
| POST | /v1/billing/checkout | Create checkout |

## Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_PASSWORD | PostgreSQL password |
| JWT_ACCESS_SECRET | JWT access token secret (64+ chars) |
| ENCRYPTION_KEY | WireGuard key encryption key |
| NODE_AGENT_SECRET | Secret for VPN node authentication |
| STRIPE_SECRET_KEY | Stripe API key |

## DNS Records Format

```
# Main domains (A records to main server IP)
api        A    192.168.1.100
app        A    192.168.1.100
admin      A    192.168.1.100

# VPN Node domains (A records to node IPs)
sg1        A    192.168.1.101
jp1        A    192.168.1.102
us1        A    192.168.1.103
```

## Default Credentials

| Service | Username | Password |
|---------|-----------|----------|
| Grafana | admin | From GRAFANA_ADMIN_PASSWORD env |
| API Docs | - | None |
| Database | converso_user | From DATABASE_PASSWORD |