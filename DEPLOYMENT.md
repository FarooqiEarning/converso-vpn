# Converso VPN - Complete Deployment Guide

> **Version:** 1.0.0 | **For:** Production & Development

---

## Table of Contents

1. [Domain & DNS Setup](#1-domain--dns-setup)
2. [Control Plane (Main Server)](#2-control-plane-main-server)
3. [VPN Node Deployment](#3-vpn-node-deployment)
4. [SSL/TLS Configuration](#4-ssltls-configuration)
5. [Post-Deployment](#5-post-deployment)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Domain & DNS Setup

### Required Domains

| Domain | Purpose | IP/Target |
|--------|---------|-----------|
| `api.vpn.conversoempire.world` | Control Plane API | Your Main Server IP |
| `app.vpn.conversoempire.world` | Customer Dashboard (Web) | Your Main Server IP |
| `admin.vpn.conversoempire.world` | Admin Panel | Your Main Server IP |
| `vpn.conversoempire.world` | Main landing page | Your Main Server IP |
| `*.vpn.conversoempire.world` | Wildcard for future | Your Main Server IP |

### VPN Node Domains (Per Node)

| Domain | Format | Example |
|--------|--------|---------|
| Node Hostname | `{location}{number}.vpn.conversoempire.world` | `sg1.vpn.conversoempire.world` |
| Node Endpoint | `{hostname}:51820` | `sg1.vpn.conversoempire.world:51820` |

### DNS Records to Create

```
# A Records (Point to your main server IP: 192.168.1.100)
api.vpn.conversoempire.world     A    192.168.1.100
app.vpn.conversoempire.world     A    192.168.1.100
admin.vpn.conversoempire.world    A    192.168.1.100
vpn.conversoempire.world         A    192.168.1.100

# A Records for VPN Nodes (Each node gets its own IP)
sg1.vpn.conversoempire.world     A    192.168.1.101
jp1.vpn.conversoempire.world     A    192.168.1.102
us1.vpn.conversoempire.world     A    192.168.1.103

# SRV Records (Optional - for auto-discovery)
_wireguard._udp.vpn.conversoempire.world  SRV  0 5 51820 sg1.vpn.conversoempire.world
```

### Recommended DNS Provider Settings

- **Use Cloudflare** for DNS management
- Enable **DNSSEC** for security
- Set **TTL** to 300 (5 minutes) for records that might change
- Use ** proxied** (orange cloud) for web domains, **DNS only** (gray cloud) for VPN nodes

---

## 2. Control Plane (Main Server)

### Server Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 50 GB SSD | 100+ GB SSD |
| Bandwidth | 100 Mbps | 1 Gbps |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### Installation Steps

#### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl git nginx certbot python3-certbot-nginx docker.io docker compose

# Configure firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 51820/udp # WireGuard
sudo ufw enable

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### Step 2: Clone & Configure

```bash
# Clone the repository
cd /opt
sudo git clone https://github.com/FarooqiEarning/converso-vpn.git
cd converso-vpn

# Copy environment file
sudo cp .env.example .env

# Edit environment variables
sudo nano .env
```

#### Step 3: Configure .env

```bash
# Required .env values to fill:

# APP
NODE_ENV=production
FRONTEND_URL=https://app.vpn.conversoempire.world
ADMIN_URL=https://admin.vpn.conversoempire.world
CORS_ORIGINS=https://app.vpn.conversoempire.world,https://admin.vpn.conversoempire.world

# DATABASE (use postgres as hostname for docker compose)
DATABASE_HOST=postgres
DATABASE_USERNAME=converso_user
DATABASE_PASSWORD=your_very_strong_password_here
DATABASE_NAME=converso_vpn

# REDIS
REDIS_PASSWORD=your_very_strong_redis_password

# JWT (generate 64+ character random strings)
JWT_ACCESS_SECRET=your_64_char_random_string_access
JWT_REFRESH_SECRET=your_64_char_random_string_refresh

# NEXTAUTH (for web)
NEXTAUTH_SECRET=your_64_char_random_string_nextauth
NEXTAUTH_URL=https://app.vpn.conversoempire.world

# GOOGLE OAUTH
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# STRIPE
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# NODE AGENT
NODE_AGENT_SECRET=your_strong_agent_secret

# ENCRYPTION (generate: openssl rand -base64 32)
ENCRYPTION_KEY=your_32_byte_base64_key
```

#### Step 4: Generate SSL Certificates

```bash
# Using Let's Encrypt (for production)
sudo certbot --nginx -d api.vpn.conversoempire.world -d app.vpn.conversoempire.world -d admin.vpn.conversoempire.world

# Copy certificates for nginx
sudo cp /etc/letsencrypt/live/vpn.conversoempire.world/fullchain.pem infrastructure/nginx/ssl/server.crt
sudo cp /etc/letsencrypt/live/vpn.conversoempire.world/privkey.pem infrastructure/nginx/ssl/server.key

# Or generate self-signed for testing
cd infrastructure/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.crt -subj "/CN=localhost"
```

#### Step 5: Start Services

```bash
# Start production stack
docker compose -f docker compose.prod.yml up -d

# Check status
docker compose -f docker compose.prod.yml ps

# View logs
docker compose -f docker compose.prod.yml logs -f api
```

### Service URLs (After Deployment)

| Service | URL |
|---------|-----|
| API | https://api.vpn.conversoempire.world/v1 |
| Swagger Docs | https://api.vpn.conversoempire.world/api/docs |
| Web App | https://app.vpn.conversoempire.world |
| Admin Panel | https://admin.vpn.conversoempire.world |
| Prometheus | http://your-ip:9090 |
| Grafana | http://your-ip:3002 |

---

## 3. VPN Node Deployment

### Node Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 core | 2+ cores |
| RAM | 1 GB | 2+ GB |
| Storage | 10 GB | 20+ GB |
| Bandwidth | 100 Mbps | 1 Gbps |
| IP | 1 IPv4 + 1 Dedicated for VPN | Public IP required |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### Node Setup Script

Create a script `deploy-node.sh`:

```bash
#!/bin/bash
set -e

# ============================================
# CONVERSO VPN NODE DEPLOYMENT SCRIPT
# ============================================

# Configuration
NODE_NAME="${1:-sg1}"
NODE_ID="${2:-$(uuidgen)}"
SERVER_IP="${3:-192.168.1.100}"
AGENT_SECRET="${4:-your_agent_secret}"
CONTROL_PLANE_URL="${5:-https://api.vpn.conversoempire.world}"

echo "=== Deploying VPN Node: $NODE_NAME ==="

# Update & Install Dependencies
echo "[1/7] Updating system..."
apt update && apt upgrade -y
apt install -y curl git wireguard make gcc linux-headers-$(uname -r)

# Enable IP Forwarding
echo "[2/7] Configuring IP forwarding..."
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
sysctl -p

# Install Node Agent
echo "[3/7] Installing Node Agent..."
cd /opt
git clone https://github.com/FarooqiEarning/converso-vpn.git || (cd converso-vpn && git pull)
cd converso-vpn/apps/node-agent

# Create config
mkdir -p /etc/converso-agent
cat > /etc/converso-agent/config.yaml << EOF
node_name: $NODE_NAME
node_id: $NODE_ID
control_plane_url: $CONTROL_PLANE_URL
agent_secret: $AGENT_SECRET
http_port: 9100
grpc_port: 50051
heartbeat_interval: 30s
wireguard:
  interface: wg0
  listen_port: 51820
EOF

# Build and start agent
echo "[4/7] Building Node Agent..."
docker build -t converso-node-agent:latest .

# Create docker compose for node
cat > /opt/converso-node/docker compose.yml << EOF
version: '3.9'
services:
  node-agent:
    image: converso-node-agent:latest
    container_name: converso-node-$NODE_NAME
    restart: unless-stopped
    network_mode: host
    environment:
      - NODE_NAME=$NODE_NAME
      - NODE_ID=$NODE_ID
      - CONTROL_PLANE_URL=$CONTROL_PLANE_URL
      - AGENT_SECRET=$AGENT_SECRET
      - WG_INTERFACE=wg0
    volumes:
      - /etc/converso-agent:/etc/converso-agent
      - /dev/net:/dev/net
      - /run/systemd/system:/run/systemd/system
      - /lib/modules:/lib/modules
    cap_add:
      - NET_ADMIN
    privileged: true

volumes:
  node-agent-data:
EOF

# Start the node
echo "[5/7] Starting Node Agent..."
cd /opt/converso-node
docker compose up -d

# Configure WireGuard
echo "[6/7] Configuring WireGuard interface..."
cat > /etc/wireguard/wg0.conf << EOF
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = $(wg genkey)
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
SaveConfig = true
EOF

wg-quick up wg0 || true
systemctl enable wg-quick@wg0

# Register with Control Plane
echo "[7/7] Registering with Control Plane..."
sleep 5
curl -X POST "${CONTROL_PLANE_URL}/v1/internal/nodes/register" \
  -H "Content-Type: application/json" \
  -H "X-Agent-Secret: $AGENT_SECRET" \
  -d "{\"node_id\":\"$NODE_ID\",\"node_name\":\"$NODE_NAME\",\"public_key\":\"$(wg pubkey < /etc/wireguard/wg0.conf | grep PrivateKey -A1 | tail -1)\"}"

echo "=== Node $NODE_NAME deployed successfully ==="
echo "Node ID: $NODE_ID"
echo "Public Key: $(wg pubkey < /etc/wireguard/wg0.conf | grep PrivateKey -A1 | tail -1)"
```

### Run Node Deployment

```bash
# Make executable
chmod +x deploy-node.sh

# Deploy a node (name, id, server-ip, secret, api-url)
./deploy-node.sh sg1 "550e8400-e29b-41d4-a716-446655440000" "192.168.1.100" "your_agent_secret" "https://api.vpn.conversoempire.world"
```

### Node Health Check

```bash
# Check agent status
docker logs converso-node-sg1

# Check WireGuard status
wg show

# Check metrics
curl http://localhost:9100/metrics
```

---

## 4. SSL/TLS Configuration

### Option A: Let's Encrypt (Recommended for Production)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate for all domains
sudo certbot --nginx -d api.vpn.conversoempire.world \
               -d app.vpn.conversoempire.world \
               -d admin.vpn.conversoempire.world \
               -d vpn.conversoempire.world

# Auto-renewal (certbot adds this automatically)
sudo certbot renew --dry-run
```

### Option B: Manual SSL (Self-Signed for Testing)

```bash
# Generate self-signed certificate
cd /etc/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key -out server.crt \
  -subj "/C=US/ST=CA/L=SanFrancisco/O=ConversoVPN/CN=*.vpn.conversoempire.world"
```

### Option C: Cloudflare Origin Certificates

```bash
# Generate in Cloudflare Dashboard > SSL/TLS > Origin Server
# Download certificate and key
# Save as:
#   /etc/nginx/ssl/origin.crt
#   /etc/nginx/ssl/origin.key

# Update nginx config to use these files
```

---

## 5. Post-Deployment

### Initial Setup

```bash
# 1. Create admin user (via API or admin panel)
# 2. Create subscription plans in database
# 3. Add initial VPN nodes
# 4. Configure payment gateway (Stripe)
# 5. Test user registration flow
# 6. Test device creation and WireGuard config download
```

### Database Seeding

```bash
# Connect to API container
docker exec -it converso-api sh

# Run seed
npm run db:seed

# Or manually via TypeORM
npm run db:migrate
```

### Monitoring Setup

```bash
# Access Grafana at http://your-ip:3002
# Default credentials: admin / (password from GRAFANA_ADMIN_PASSWORD env)

# Import dashboards from:
# monitoring/grafana/dashboards/converso-overview.json
```

### Backup Configuration

```bash
# Database backup
docker exec converso-postgres pg_dump -U converso_user converso_vpn > backup_$(date +%Y%m%d).sql

# Configuration backup
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env infrastructure/nginx infrastructure/prometheus
```

---

## 6. Troubleshooting

### Common Issues

#### API Not Starting
```bash
# Check logs
docker logs converso-api

# Common fix: Database connection
# Verify DATABASE_PASSWORD in .env matches PostgreSQL
```

#### Web App 502 Error
```bash
# Check if web is running
docker ps | grep web

# Check nginx logs
docker logs converso-nginx
tail -f /var/log/nginx/error.log
```

#### VPN Nodes Not Connecting
```bash
# Verify agent can reach API
docker exec converso-node-sg1 curl https://api.vpn.conversoempire.world/v1/nodes

# Check firewall on node
sudo ufw status
sudo iptables -L -n
```

#### SSL Certificate Issues
```bash
# Check certificate
openssl s_client -connect api.vpn.conversoempire.world:443

# Renew certificate
sudo certbot renew

# Reload nginx
docker exec converso-nginx nginx -s reload
```

### Health Check Endpoints

| Endpoint | URL | Purpose |
|----------|-----|---------|
| API Health | `GET /v1/health` | Basic health check |
| Node Agent | `GET http://node-ip:9100/health` | Node status |
| Prometheus | `GET /-/healthy` | Prometheus health |
| Grafana | `GET /api/health` | Grafana health |

### Useful Commands

```bash
# Restart all services
docker compose restart

# View resource usage
docker stats

# Tail specific service logs
docker logs -f converso-api

# Access database
docker exec -it converso-postgres psql -U converso_user -d converso_vpn

# Rebuild specific service
docker compose build api --no-cache
docker compose up -d --no-deps api
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable UFW firewall
- [ ] Configure fail2ban
- [ ] Use strong JWT secrets (64+ chars)
- [ ] Enable 2FA for admin accounts
- [ ] Configure rate limiting
- [ ] Use HTTPS only
- [ ] Regular backups
- [ ] Log monitoring
- [ ] Update system regularly

---

## Support

For issues, check:
1. Docker logs: `docker logs <container>`
2. API docs: `/api/docs`
3. System logs: `/var/log/syslog`
4. Cloudflare dashboard for DNS issues