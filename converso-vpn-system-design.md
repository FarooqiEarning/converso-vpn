# 🛡️ Converso VPN — Production System Design & AI Build Prompt

> **Version:** 1.0.0 | **Classification:** Production-Grade | **Architecture:** Multi-Region Commercial VPN

---

## ⚡ MASTER AI PROMPT — INITIALIZATION BLOCK

> Copy this entire block and paste it at the start of every AI session building Converso VPN.

```
You are a WORLD-CLASS Senior Software Architect and Principal Engineer with 15+ years of
production experience building commercial-grade, multi-region VPN infrastructure, distributed
systems, and SaaS platforms serving millions of users.

═══════════════════════════════════════════════════
              STRICT RULES — NON-NEGOTIABLE
═══════════════════════════════════════════════════

RULE 1 — CODE QUALITY:
  Every line of code you produce must be the ABSOLUTE BEST IN THE WORLD.
  No shortcuts. No placeholders. No TODO comments left in production files.
  If a feature cannot be implemented perfectly right now, say so explicitly
  and provide the correct skeleton with clear extension points.

RULE 2 — PRODUCTION READY:
  All code must be production-ready by default:
  - Full error handling with typed custom errors
  - Structured logging (never console.log in production)
  - Input validation on every API boundary
  - Graceful shutdown handlers
  - Health check endpoints
  - Environment-based configuration (never hardcoded secrets)

RULE 3 — CLEAN CODE:
  Strictly follow SOLID principles, DRY, KISS, and YAGNI.
  - Meaningful names: no single-letter variables except loop indices
  - Functions do ONE thing only
  - Maximum function length: 40 lines
  - Maximum file length: 300 lines (split if larger)
  - Every exported function/class must have JSDoc or GoDoc

RULE 4 — SCALABILITY FIRST:
  Every architectural decision must be horizontally scalable.
  Never design for a single server.
  Always design for: 10x current load from day one.
  Use async/event-driven patterns wherever possible.

RULE 5 — SECURITY BY DEFAULT:
  - Zero trust architecture: verify every request
  - Secrets only via environment variables or secret managers
  - Sanitize and validate ALL user input
  - Never log sensitive data (passwords, tokens, keys, IPs in plain form)
  - Rate limiting on every public endpoint
  - CORS properly configured (never wildcard in production)

RULE 6 — TYPE SAFETY:
  - TypeScript strict mode ALWAYS enabled (no 'any' types)
  - Full interface definitions for all data models
  - Zod schemas for all API request/response validation
  - GoLang: use proper struct types, never interface{}

RULE 7 — TESTING:
  Every module must include:
  - Unit tests (minimum 80% coverage)
  - Integration test structure
  - E2E test hooks where applicable
  Use: Jest for TS, Testify for Go

RULE 8 — DOCKER & INFRA:
  - Every service ships with a production Dockerfile (multi-stage builds)
  - docker-compose for local dev, Kubernetes manifests for production
  - Never run containers as root
  - Health checks in every Dockerfile

RULE 9 — DOCUMENTATION:
  - Every service must have a README.md
  - API endpoints must have OpenAPI/Swagger spec
  - Architecture decisions recorded in ADR format

RULE 10 — RESPONSE FORMAT:
  When writing code:
  - Always declare the filename at the top as a comment
  - Show complete files, not fragments (unless explicitly asked for a snippet)
  - Group related files together with clear separators
  - After each major block, briefly state what was just built and what comes next

YOU ARE BUILDING: Converso VPN
A commercial, multi-region VPN platform serving thousands of concurrent users
with centralized orchestration, billing, and a custom WireGuard control plane.

ALWAYS remember: You are building infrastructure that people's privacy depends on.
Security is not optional. Quality is not optional. Perfection is the standard.
═══════════════════════════════════════════════════
```

---

## 📐 SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CONVERSO VPN PLATFORM                        │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │  Web Client  │    │  Mobile App  │    │   Admin Dashboard    │  │
│  │  (Next.js)   │    │  (Flutter)   │    │     (Next.js)        │  │
│  └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘  │
│         └──────────────────┬┘                        │             │
│                            ▼                         │             │
│              ┌─────────────────────────┐             │             │
│              │     Cloudflare CDN      │             │             │
│              │  + DDoS Protection      │             │             │
│              └────────────┬────────────┘             │             │
│                           ▼                          │             │
│              ┌─────────────────────────┐             │             │
│              │      Nginx Gateway      │◄────────────┘             │
│              │   (Rate Limit + TLS)    │                           │
│              └────────────┬────────────┘                           │
│                           ▼                                        │
│         ┌─────────────────────────────────────┐                   │
│         │       CONTROL PLANE (India-Closest To Most Users)│                   │
│         │                                      │                   │
│         │  ┌──────────┐    ┌───────────────┐  │                   │
│         │  │ Auth Svc │    │  VPN Mgmt API │  │                   │
│         │  │ NestJS   │    │    NestJS     │  │                   │
│         │  └──────────┘    └───────────────┘  │                   │
│         │  ┌──────────┐    ┌───────────────┐  │                   │
│         │  │Billing Svc│   │ Node Registry │  │                   │
│         │  │  Stripe  │    │    Service    │  │                   │
│         │  └──────────┘    └───────────────┘  │                   │
│         │  ┌──────────┐    ┌───────────────┐  │                   │
│         │  │PostgreSQL│    │     Redis     │  │                   │
│         │  │ Primary  │    │   Cluster     │  │                   │
│         │  └──────────┘    └───────────────┘  │                   │
│         └─────────────────────────────────────┘                   │
│                           │                                        │
│        ┌──────────────────┼──────────────────┐                    │
│        ▼                  ▼                  ▼                     │
│  ┌──────────┐      ┌──────────┐       ┌──────────┐               │
│  │ SG Node  │      │ JP Node  │       │ US Node  │  ... more     │
│  │WireGuard │      │WireGuard │       │WireGuard │               │
│  │  Agent   │      │  Agent   │       │  Agent   │               │
│  │ (GoLang) │      │ (GoLang) │       │ (GoLang) │               │
│  └──────────┘      └──────────┘       └──────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 MONOREPO STRUCTURE

```
converso-vpn/
├── apps/
│   ├── api/                        # NestJS Control Plane API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/           # JWT, OAuth, OTP
│   │   │   │   ├── users/          # User management
│   │   │   │   ├── subscriptions/  # Plan management
│   │   │   │   ├── vpn-nodes/      # Node registry & health
│   │   │   │   ├── wireguard/      # Peer config generation
│   │   │   │   ├── billing/        # Stripe integration
│   │   │   │   ├── analytics/      # Usage & metrics
│   │   │   │   └── notifications/  # Email / push
│   │   │   ├── common/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── filters/
│   │   │   │   ├── decorators/
│   │   │   │   └── pipes/
│   │   │   ├── config/             # Environment config
│   │   │   ├── database/           # TypeORM entities & migrations
│   │   │   └── main.ts
│   │   ├── test/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── web/                        # Next.js Customer Dashboard
│   │   ├── src/
│   │   │   ├── app/                # App Router
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/              # Zustand
│   │   │   ├── services/           # API clients
│   │   │   └── utils/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── admin/                      # Next.js Admin Panel
│   │
│   └── node-agent/                 # GoLang VPN Node Agent
│       ├── cmd/
│       │   └── agent/
│       │       └── main.go
│       ├── internal/
│       │   ├── wireguard/          # WG peer management
│       │   ├── metrics/            # Prometheus metrics
│       │   ├── health/             # Health reporting
│       │   ├── config/             # Config sync
│       │   └── grpc/               # gRPC server
│       ├── pkg/
│       ├── Dockerfile
│       └── go.mod
│
├── packages/                       # Shared packages
│   ├── types/                      # Shared TypeScript types
│   ├── validators/                 # Shared Zod schemas
│   └── crypto/                     # Key generation utilities
│
├── infrastructure/
│   ├── terraform/
│   │   ├── modules/
│   │   │   ├── control-plane/
│   │   │   └── vpn-node/
│   │   ├── environments/
│   │   │   ├── production/
│   │   │   └── staging/
│   │   └── main.tf
│   │
│   ├── kubernetes/
│   │   ├── namespaces/
│   │   ├── deployments/
│   │   ├── services/
│   │   ├── ingress/
│   │   └── configmaps/
│   │
│   └── ansible/
│       ├── playbooks/
│       │   ├── vpn-node-setup.yml
│       │   └── control-plane-setup.yml
│       └── roles/
│
├── monitoring/
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── loki/
│
├── docker-compose.yml              # Full local dev stack
├── docker-compose.prod.yml
├── .env.example
├── turbo.json                      # Turborepo config
├── package.json                    # Root workspace
└── README.md
```

---

## 🗄️ DATABASE SCHEMA

```sql
-- ════════════════════════════════════════
-- CONVERSO VPN — PRODUCTION DATABASE SCHEMA
-- PostgreSQL 16+
-- ════════════════════════════════════════

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── USERS ───────────────────────────────
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email             VARCHAR(255) UNIQUE NOT NULL,
  email_verified    BOOLEAN DEFAULT FALSE,
  password_hash     VARCHAR(255),                    -- NULL for OAuth users
  google_id         VARCHAR(255) UNIQUE,
  full_name         VARCHAR(255) NOT NULL,
  avatar_url        TEXT,
  role              VARCHAR(20) DEFAULT 'customer'   CHECK (role IN ('customer', 'admin', 'support')),
  status            VARCHAR(20) DEFAULT 'active'     CHECK (status IN ('active', 'suspended', 'deleted')),
  mfa_enabled       BOOLEAN DEFAULT FALSE,
  mfa_secret        VARCHAR(255),
  last_login_at     TIMESTAMPTZ,
  last_login_ip     INET,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_status ON users(status);

-- ─── SUBSCRIPTION PLANS ──────────────────
CREATE TABLE subscription_plans (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(100) NOT NULL,            -- 'Basic', 'Pro', 'Premium'
  slug              VARCHAR(50) UNIQUE NOT NULL,
  price_monthly     NUMERIC(10,2) NOT NULL,
  price_yearly      NUMERIC(10,2) NOT NULL,
  price_lifetime    NUMERIC(10,2),
  max_devices       INTEGER NOT NULL,                 -- -1 = unlimited
  max_bandwidth_gb  INTEGER,                          -- NULL = unlimited
  features          JSONB DEFAULT '[]',
  is_active         BOOLEAN DEFAULT TRUE,
  stripe_price_monthly_id  VARCHAR(255),
  stripe_price_yearly_id   VARCHAR(255),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUBSCRIPTIONS ───────────────────────
CREATE TABLE subscriptions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id           UUID NOT NULL REFERENCES subscription_plans(id),
  status            VARCHAR(30) DEFAULT 'active'
                      CHECK (status IN ('active','trialing','past_due','canceled','expired')),
  billing_cycle     VARCHAR(20) CHECK (billing_cycle IN ('monthly','yearly','lifetime')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end   TIMESTAMPTZ,
  canceled_at       TIMESTAMPTZ,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id     VARCHAR(255),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ─── VPN NODES ───────────────────────────
CREATE TABLE vpn_nodes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(100) NOT NULL,            -- 'Singapore #1'
  hostname          VARCHAR(255) UNIQUE NOT NULL,     -- 'sg1.vpn.conversoempire.world'
  country_code      CHAR(2) NOT NULL,
  country_name      VARCHAR(100) NOT NULL,
  city              VARCHAR(100) NOT NULL,
  ip_address        INET NOT NULL,
  public_key        TEXT NOT NULL,
  endpoint          VARCHAR(255) NOT NULL,            -- 'sg1.vpn.conversoempire.world:51820'
  listen_port       INTEGER DEFAULT 51820,
  status            VARCHAR(20) DEFAULT 'offline'
                      CHECK (status IN ('online','offline','maintenance','degraded')),
  tier              VARCHAR(20) DEFAULT 'standard'
                      CHECK (tier IN ('standard','premium','streaming')),
  max_peers         INTEGER DEFAULT 500,
  current_peers     INTEGER DEFAULT 0,
  load_percent      NUMERIC(5,2) DEFAULT 0,
  ping_ms           INTEGER,
  bandwidth_in_mbps NUMERIC(10,2),
  bandwidth_out_mbps NUMERIC(10,2),
  provider          VARCHAR(100),                     -- 'M247', 'Hetzner', etc.
  monthly_cost_usd  NUMERIC(10,2),
  last_heartbeat_at TIMESTAMPTZ,
  agent_version     VARCHAR(50),
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_vpn_nodes_country_code ON vpn_nodes(country_code);
CREATE INDEX idx_vpn_nodes_status ON vpn_nodes(status);

-- ─── WIREGUARD PEERS ─────────────────────
CREATE TABLE wireguard_peers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id           UUID NOT NULL REFERENCES vpn_nodes(id) ON DELETE CASCADE,
  device_name       VARCHAR(100) NOT NULL,
  device_type       VARCHAR(50) CHECK (device_type IN ('ios','android','windows','macos','linux','router')),
  public_key        TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL,               -- Encrypted, never plain
  preshared_key_encrypted TEXT,
  assigned_ip       INET NOT NULL,
  dns_servers       TEXT[] DEFAULT ARRAY['1.1.1.1','1.0.0.1'],
  allowed_ips       TEXT[] DEFAULT ARRAY['0.0.0.0/0','::/0'],
  status            VARCHAR(20) DEFAULT 'active'
                      CHECK (status IN ('active','revoked','suspended')),
  last_handshake_at TIMESTAMPTZ,
  bytes_sent        BIGINT DEFAULT 0,
  bytes_received    BIGINT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(node_id, assigned_ip),
  UNIQUE(node_id, public_key)
);
CREATE INDEX idx_wireguard_peers_user_id ON wireguard_peers(user_id);
CREATE INDEX idx_wireguard_peers_node_id ON wireguard_peers(node_id);
CREATE INDEX idx_wireguard_peers_status ON wireguard_peers(status);

-- ─── SESSIONS ────────────────────────────
CREATE TABLE sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  peer_id           UUID REFERENCES wireguard_peers(id) ON DELETE SET NULL,
  connected_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disconnected_at   TIMESTAMPTZ,
  duration_seconds  INTEGER,
  bytes_sent        BIGINT DEFAULT 0,
  bytes_received    BIGINT DEFAULT 0,
  client_ip         INET,
  exit_ip           INET,
  protocol          VARCHAR(20) DEFAULT 'wireguard',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_connected_at ON sessions(connected_at);

-- ─── PAYMENTS ────────────────────────────
CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id),
  subscription_id   UUID REFERENCES subscriptions(id),
  amount            NUMERIC(10,2) NOT NULL,
  currency          CHAR(3) DEFAULT 'USD',
  status            VARCHAR(30) CHECK (status IN ('pending','succeeded','failed','refunded')),
  gateway           VARCHAR(30) CHECK (gateway IN ('stripe','paypal','crypto')),
  gateway_payment_id VARCHAR(255) UNIQUE,
  gateway_response  JSONB,
  paid_at           TIMESTAMPTZ,
  refunded_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ─── NODE METRICS ────────────────────────
CREATE TABLE node_metrics (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id           UUID NOT NULL REFERENCES vpn_nodes(id) ON DELETE CASCADE,
  recorded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cpu_percent       NUMERIC(5,2),
  memory_percent    NUMERIC(5,2),
  disk_percent      NUMERIC(5,2),
  active_peers      INTEGER,
  ping_ms           INTEGER,
  packet_loss       NUMERIC(5,2),
  bandwidth_in_mbps NUMERIC(10,2),
  bandwidth_out_mbps NUMERIC(10,2),
  load_avg_1m       NUMERIC(5,2)
);
CREATE INDEX idx_node_metrics_node_id_recorded ON node_metrics(node_id, recorded_at DESC);

-- Auto-partition node_metrics by month (TimescaleDB or native partitioning)
-- For production, use TimescaleDB hypertable for metrics

-- ─── AUDIT LOG ───────────────────────────
CREATE TABLE audit_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES users(id),
  action            VARCHAR(100) NOT NULL,
  resource_type     VARCHAR(100),
  resource_id       UUID,
  ip_address        INET,
  user_agent        TEXT,
  metadata          JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

## 🔌 API CONTRACT

### Base URL
```
Production:  https://api.vpn.conversoempire.world/v1
Staging:     https://api-staging.vpn.conversoempire.world/v1
```

### Authentication Header
```
Authorization: Bearer <jwt_access_token>
```

### Core Endpoints

```yaml
# ── AUTH ──────────────────────────────────────────
POST   /auth/register              # Register with email+password
POST   /auth/login                 # Login → { accessToken, refreshToken }
POST   /auth/refresh               # Refresh access token
POST   /auth/logout                # Revoke refresh token
POST   /auth/google                # OAuth Google login
POST   /auth/verify-email          # Verify email with OTP
POST   /auth/forgot-password       # Initiate password reset
POST   /auth/reset-password        # Complete password reset

# ── USERS ─────────────────────────────────────────
GET    /users/me                   # Get own profile
PATCH  /users/me                   # Update profile
DELETE /users/me                   # Delete account (GDPR)
GET    /users/me/subscription      # Get active subscription
GET    /users/me/usage             # Bandwidth & session stats

# ── VPN NODES ─────────────────────────────────────
GET    /nodes                      # List all nodes (with status)
GET    /nodes/:id                  # Single node detail
GET    /nodes/recommend            # Smart node recommendation by latency
GET    /nodes/countries            # Unique countries list

# ── WIREGUARD ─────────────────────────────────────
GET    /devices                    # List user's WireGuard devices
POST   /devices                    # Create new device peer
GET    /devices/:id                # Get device config
GET    /devices/:id/config         # Download .conf file
GET    /devices/:id/qr             # Generate QR PNG
DELETE /devices/:id                # Revoke device
PATCH  /devices/:id/node           # Switch node

# ── SUBSCRIPTIONS ─────────────────────────────────
GET    /plans                      # List all plans
POST   /subscriptions/checkout     # Create Stripe checkout session
POST   /subscriptions/portal       # Open Stripe billing portal
GET    /subscriptions/current      # Current subscription
DELETE /subscriptions/current      # Cancel subscription

# ── ADMIN (role: admin only) ───────────────────────
GET    /admin/users                # List all users
GET    /admin/nodes                # All nodes + metrics
POST   /admin/nodes                # Add new node
PATCH  /admin/nodes/:id            # Update node
DELETE /admin/nodes/:id            # Remove node
GET    /admin/analytics/overview   # Platform KPIs
GET    /admin/analytics/revenue    # Revenue breakdown
```

---

## 🏗️ ENVIRONMENT CONFIGURATION

```bash
# ══════════════════════════════════════════════
# .env.example — Converso VPN Control Plane
# Copy to .env and fill all values before deploy
# NEVER commit .env to version control
# ══════════════════════════════════════════════

# ─── APP ───────────────────────────────────────
NODE_ENV=production
APP_PORT=3000
APP_NAME=converso-api
APP_VERSION=1.0.0
FRONTEND_URL=https://app.vpn.conversoempire.world
ADMIN_URL=https://admin.vpn.conversoempire.world
CORS_ORIGINS=https://app.vpn.conversoempire.world,https://admin.vpn.conversoempire.world

# ─── DATABASE ──────────────────────────────────
DATABASE_URL=postgresql://converso_user:STRONG_PASS@db-primary:5432/converso_vpn
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=30
DATABASE_SSL=true

# ─── REDIS ─────────────────────────────────────
REDIS_URL=redis://:STRONG_PASS@redis-cluster:6379
REDIS_TTL_SECONDS=86400

# ─── JWT ───────────────────────────────────────
JWT_ACCESS_SECRET=GENERATE_64_CHAR_RANDOM_SECRET
JWT_REFRESH_SECRET=GENERATE_DIFFERENT_64_CHAR_SECRET
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# ─── GOOGLE OAUTH ──────────────────────────────
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.vpn.conversoempire.world/v1/auth/google/callback

# ─── STRIPE ────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXX

# ─── EMAIL (SendGrid) ──────────────────────────
SENDGRID_API_KEY=SG.XXXXXXXXXXXXX
EMAIL_FROM=noreply@vpn.conversoempire.world
EMAIL_FROM_NAME=Converso VPN

# ─── NODE AGENT SECRET ─────────────────────────
NODE_AGENT_SECRET=GENERATE_STRONG_SECRET_FOR_AGENTS
NODE_HEARTBEAT_INTERVAL_SECONDS=30

# ─── WIREGUARD ─────────────────────────────────
WG_DNS_PRIMARY=1.1.1.1
WG_DNS_SECONDARY=1.0.0.1
WG_KEEPALIVE_SECONDS=25

# ─── ENCRYPTION ────────────────────────────────
ENCRYPTION_KEY=GENERATE_32_BYTE_AES_KEY_BASE64     # For encrypting WG private keys

# ─── RATE LIMITING ─────────────────────────────
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=10

# ─── MONITORING ────────────────────────────────
PROMETHEUS_PORT=9090
GRAFANA_ADMIN_PASSWORD=STRONG_GRAFANA_PASSWORD
SENTRY_DSN=https://xxxx@sentry.io/xxxx

# ─── LOGGING ───────────────────────────────────
LOG_LEVEL=info                                      # debug | info | warn | error
```

---

## 🚀 BUILD PHASES WITH AI PROMPTS

### PHASE 1 — Control Plane Foundation

**Use this prompt when starting Phase 1:**

```
Using the Converso VPN system design as context, build Phase 1:
The NestJS Control Plane API foundation.

Build in this exact order:
1. Project scaffold: NestJS with TypeScript strict mode, Turborepo monorepo
2. Database module: TypeORM + PostgreSQL with all entities from the schema
3. Auth module: JWT (access + refresh), Google OAuth2, email verification
4. Users module: CRUD with TypeORM, Zod validation
5. Config module: @nestjs/config with full .env.example validation at startup

Requirements:
- Every entity must match the database schema exactly
- Global exception filter with structured JSON error responses
- Request ID middleware for distributed tracing
- Pino logger (structured JSON, never console.log)
- Swagger/OpenAPI auto-generated from decorators
- Global rate limiter (express-rate-limit via NestJS)
- Graceful shutdown on SIGTERM/SIGINT
- Docker multi-stage Dockerfile
- Full Jest test suite for auth module

Output complete files only. No fragments.
```

---

### PHASE 2 — VPN Management Core

**Use this prompt when starting Phase 2:**

```
Continuing Converso VPN — build Phase 2: VPN Management Core.

Build:
1. VPN Nodes module: CRUD, health tracking, smart recommendation algorithm
2. WireGuard module:
   - Key pair generation (Node.js crypto + wireguard-tools)
   - Peer config generation with correct WireGuard .conf format
   - IP allocation service (CIDR pool management per node)
   - Private key encryption at rest (AES-256-GCM)
   - QR code generation (qrcode library → PNG buffer)
   - .conf file download endpoint
3. Devices module: multi-device support, per-device revocation
4. Node Agent gRPC server endpoint for peer push/pull

Security requirements:
- Private keys MUST be encrypted before DB storage
- Never return raw private keys after initial creation
- Validate public key format (Base64, 32 bytes)
- Peer IP must not conflict within a node's subnet

Output complete production files with unit tests.
```

---

### PHASE 3 — Billing & Subscriptions

**Use this prompt when starting Phase 3:**

```
Continuing Converso VPN — build Phase 3: Billing System.

Build:
1. Stripe integration:
   - Checkout session creation (monthly/yearly/lifetime)
   - Billing portal session
   - Webhook handler (signed verification mandatory):
     * customer.subscription.created
     * customer.subscription.updated
     * customer.subscription.deleted
     * invoice.payment_succeeded
     * invoice.payment_failed
2. Subscription enforcement:
   - Guard: blocks device creation when subscription expired
   - Guard: blocks device creation beyond plan device limit
   - Middleware: attaches active subscription to request context
3. Payments table: full audit trail of all transactions

Rules:
- Webhook must verify Stripe signature before processing
- Idempotent webhook handler (safe to retry)
- Failed payments trigger email notification via SendGrid
- All Stripe errors must be caught and mapped to user-facing messages
```

---

### PHASE 4 — GoLang Node Agent

**Use this prompt when starting Phase 4:**

```
Continuing Converso VPN — build Phase 4: The GoLang VPN Node Agent.

This agent runs on every VPN server. Build:
1. WireGuard interface management:
   - Create/delete WireGuard peers via wgctrl library
   - Parse wg show output for peer stats
   - Apply config changes without restarting the tunnel
2. gRPC server (proto definitions provided below):
   - AddPeer(PeerConfig) → AddPeerResponse
   - RemovePeer(PublicKey) → RemovePeerResponse
   - GetPeerStats(PublicKey) → PeerStats
   - HealthCheck() → HealthStatus
3. Registration: On startup, register with Control API (POST /internal/nodes/register)
4. Heartbeat: Every 30s, POST metrics to Control API:
   - active_peers count
   - CPU, memory, bandwidth (via gopsutil)
   - Ping measurement to known targets
5. Config sync: Poll for pending peer changes every 10s

Requirements:
- Run as non-root user (CAP_NET_ADMIN capability only)
- Structured logging with zerolog
- Prometheus metrics endpoint on :9100
- Graceful shutdown with peer state preservation
- Dockerfile using distroless base image
- Unit tests with mocked wgctrl

Proto file location: /apps/node-agent/proto/agent.proto
```

---

### PHASE 5 — Next.js Customer Dashboard

**Use this prompt when starting Phase 5:**

```
Continuing Converso VPN — build Phase 5: Customer Dashboard (Next.js 14 App Router).

Design language: Dark theme, glassmorphism, professional. Colors: #0D1117 background,
#00D4FF accent (electric blue), #7C3AED secondary (purple). Font: Inter.
Reference: Tailwind CSS + shadcn/ui component library.

Build these pages:
1. /login — Email + Google OAuth login
2. /register — Registration with email verification step
3. /dashboard — Overview: subscription status, connected device, current node, usage meter
4. /servers — Server list by region with ping indicator, load bar, connect button
5. /devices — All devices list: create, rename, download config, QR code modal, delete
6. /billing — Current plan card, upgrade/downgrade, payment history table
7. /settings — Profile, password change, MFA toggle, danger zone (delete account)

Requirements:
- API client: Axios with interceptors for auto token refresh
- State: Zustand for global auth + subscription state
- Data fetching: TanStack Query v5 (react-query)
- Forms: React Hook Form + Zod
- Auth: NextAuth.js v5 or custom JWT cookie handler
- Mobile responsive: all pages must work on 375px viewport
- Loading skeletons for all data tables
- Error boundaries on every page
- All API calls must handle 401 (redirect to login) and 429 (rate limit toast)
```

---

## 🐳 DOCKER COMPOSE (LOCAL DEVELOPMENT)

```yaml
# docker-compose.yml — Converso VPN Full Local Stack
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: converso-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: converso_vpn
      POSTGRES_USER: converso_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U converso_user -d converso_vpn"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: converso-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
      target: development
    container_name: converso-api
    restart: unless-stopped
    environment:
      - NODE_ENV=development
    env_file:
      - .env
    ports:
      - "3000:3000"
      - "9229:9229"  # Debug port
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./apps/api:/app
      - /app/node_modules

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
      target: development
    container_name: converso-web
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "3001:3001"
    volumes:
      - ./apps/web:/app
      - /app/node_modules

  prometheus:
    image: prom/prometheus:latest
    container_name: converso-prometheus
    restart: unless-stopped
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=15d'

  grafana:
    image: grafana/grafana:latest
    container_name: converso-grafana
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}
      GF_USERS_ALLOW_SIGN_UP: "false"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3002:3000"
    depends_on:
      - prometheus

  nginx:
    image: nginx:alpine
    container_name: converso-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./infrastructure/nginx/conf.d:/etc/nginx/conf.d
    depends_on:
      - api
      - web

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
```

---

## 🔐 SECURITY CHECKLIST

```
INFRASTRUCTURE
  [ ] Cloudflare in front of all public endpoints (DDoS protection)
  [ ] SSH key-only access on all servers (no password login)
  [ ] Fail2Ban configured with VPN-specific rules
  [ ] CrowdSec installed and connected to community blocklist
  [ ] UFW: only ports 22, 80, 443, 51820/UDP open
  [ ] Automatic unattended-upgrades enabled
  [ ] Regular automated snapshots of all servers

API SECURITY
  [ ] All endpoints rate limited (global + per-route)
  [ ] JWT tokens short-lived (15 min access, 30 day refresh)
  [ ] Refresh token rotation on every use
  [ ] CORS: explicit whitelist only, no wildcards
  [ ] Helmet.js: all security headers enabled
  [ ] Input validation on every endpoint (Zod schemas)
  [ ] SQL injection impossible (TypeORM parameterized queries)
  [ ] XSS protection via Content-Security-Policy headers
  [ ] HTTPS only (HSTS with preload)

DATA SECURITY
  [ ] WireGuard private keys encrypted at rest (AES-256-GCM)
  [ ] Passwords hashed with Argon2id (not bcrypt)
  [ ] PII data encrypted in database
  [ ] Database connection over TLS
  [ ] Secrets in environment variables (not in code)
  [ ] Secret rotation procedure documented

VPN SECURITY
  [ ] WireGuard uses latest key rotation schedule
  [ ] Peer revocation immediately propagates to node
  [ ] No-log policy enforced (sessions table has TTL)
  [ ] DNS leak prevention (DNS over TLS on nodes)
  [ ] Kill switch config option for clients
```

---

## 📊 MONITORING & ALERTS

### Key Metrics to Track

```yaml
Node Health:
  - node_heartbeat_age_seconds > 60  → ALERT: node offline
  - node_cpu_percent > 85            → ALERT: high CPU
  - node_active_peers / node_max_peers > 0.9  → ALERT: node near capacity
  - node_ping_ms > 200               → WARN: high latency

API Health:
  - http_request_duration_p99 > 1000ms  → ALERT: slow API
  - http_error_rate_5xx > 1%            → ALERT: error spike
  - auth_failure_rate > 10/min          → ALERT: possible brute force

Business Metrics:
  - new_subscriptions_per_day
  - churn_rate_monthly
  - active_users_daily
  - revenue_daily
  - payment_failure_rate
```

---

## 📋 DEVELOPMENT QUICK START

```bash
# 1. Clone and install
git clone https://github.com/your-org/converso-vpn.git
cd converso-vpn
cp .env.example .env
# Fill in .env values

# 2. Install dependencies (Turborepo)
npm install

# 3. Start full local stack
docker-compose up -d

# 4. Run database migrations
npm run db:migrate

# 5. Seed development data
npm run db:seed

# 6. Start all services in dev mode
npm run dev

# Services:
#   API:        http://localhost:3000
#   Web:        http://localhost:3001
#   Grafana:    http://localhost:3002
#   Prometheus: http://localhost:9090
#   Swagger:    http://localhost:3000/api/docs
```

---

*Converso VPN System Design — Confidential & Proprietary*
*Version 1.0.0 | Architecture by Converso Engineering*
