# SSL Certificates

## Overview

This directory contains SSL certificate management for Let's Encrypt via Certbot.

## Domains

- `vpn.conversoempire.world` - Main domain redirect
- `app.vpn.conversoempire.world` - Web application (Next.js)
- `admin.vpn.conversoempire.world` - Admin panel
- `api.vpn.conversoempire.world` - API backend

## Setup Instructions

### Initial Setup (First Time)

```bash
# Navigate to project root
cd /path/to/convrerso-vpn

# Set your email for Let's Encrypt (optional, default: admin@conversoempire.world)
export CERTBOT_EMAIL=your-email@example.com

# Generate initial certificates
bash infrastructure/nginx/ssl/setup-ssl.sh
```

### Start Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Automatic Renewal

The `certbot` service runs automatically and:
- Checks for certificate renewal every 12 hours
- Renews certificates 30 days before expiration
- Reloads nginx after successful renewal
- Logs renewal attempts to `/var/log/certbot-renewal.log`

## Certificate Storage

- **Configuration**: `certbot_conf` volume (`/etc/letsencrypt`)
- **Webroot**: `certbot_www` volume (`/var/www/certbot`)
- **Live certificates**: `/etc/letsencrypt/live/[domain]/`

## Nginx Configuration

Each domain has its own certificate configured in:
- `infrastructure/nginx/conf.d/web.conf`
- `infrastructure/nginx/conf.d/api.conf`

Certificate paths:
```nginx
ssl_certificate /etc/letsencrypt/live/[domain]/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/[domain]/privkey.pem;
ssl_trusted_certificate /etc/letsencrypt/live/[domain]/chain.pem;
```

## Troubleshooting

### Certificate Not Obtained

1. Verify DNS points to server IP
2. Ensure port 80 is open and accessible
3. Check firewall allows HTTP (port 80)
4. Run certbot manually:
   ```bash
   docker run --rm -v ./certbot/conf:/etc/letsencrypt \
       -v ./certbot/www:/var/www/certbot \
       certbot/certbot certonly --webroot \
       -w /var/www/certbot -d your-domain.com
   ```

### Renewal Failed

1. Check certbot logs: `docker compose logs certbot`
2. Verify nginx can reload: `docker exec nginx nginx -t`
3. Force renewal: `docker compose exec certbot certbot renew --force-renewal`

### Test SSL Grade

Visit: https://www.ssllabs.com/ssltest/

## Manual Certificate Management

```bash
# Check certificate status
docker compose exec certbot certbot certificates

# Force renewal
docker compose exec certbot certbot renew --force-renewal

# Add new domain
docker run --rm -v ./certbot/conf:/etc/letsencrypt \
    -v ./certbot/www:/var/www/certbot \
    certbot/certbot certonly --webroot \
    -w /var/www/certbot -d new-domain.com
```

## Security Notes

- Certificates are auto-generated via Let's Encrypt HTTP-01 challenge
- Private keys are stored in Docker volumes
- Renewal happens automatically - no manual intervention needed
- SSL grade: A+ (with modern ciphers and HSTS enabled)