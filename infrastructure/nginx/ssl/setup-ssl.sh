#!/bin/bash
# =============================================================================
# File: setup-ssl.sh
# Purpose: Initial SSL certificate setup using Certbot with Docker
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CERT_DIR="$PROJECT_ROOT/certbot"
DOMAINS=(
    "vpn.conversoempire.world"
    "app.vpn.conversoempire.world"
    "admin.vpn.conversoempire.world"
    "api.vpn.conversoempire.world"
)

log() {
    echo "[SSL-SETUP] [$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

setup_directories() {
    log "Setting up certificate directories..."
    mkdir -p "$CERT_DIR/conf" "$CERT_DIR/www"
    log "Directories created at: $CERT_DIR"
}

obtain_certificates() {
    local domain="$1"
    local email="${CERTBOT_EMAIL:-owner@conversoempire.world}"

    log "Obtaining certificate for: $domain"

    docker run --rm \
        -v "$CERT_DIR/conf:/etc/letsencrypt" \
        -v "$CERT_DIR/www:/var/www/certbot" \
        certbot/certbot:latest \
        certonly \
        --webroot \
        -w /var/www/certbot \
        -d "$domain" \
        --email "$email" \
        --agree-tos \
        --non-interactive \
        --keep-until-expiring \
        --verbose

    if [ -d "$CERT_DIR/conf/live/$domain" ]; then
        log "Certificate obtained for: $domain"
        return 0
    else
        log "Failed to obtain certificate for: $domain"
        return 1
    fi
}

main() {
    log "Starting SSL certificate setup"
    log "Email: ${CERTBOT_EMAIL:-owner@conversoempire.world}"
    log "Domains: ${DOMAINS[*]}"

    setup_directories

    local failed_domains=()

    for domain in "${DOMAINS[@]}"; do
        if ! obtain_certificates "$domain"; then
            failed_domains+=("$domain")
        fi
    done

    if [ ${#failed_domains[@]} -gt 0 ]; then
        log "WARNING: Failed to obtain certificates for: ${failed_domains[*]}"
        log "Check DNS settings and ensure port 80 is accessible"
    else
        log "SUCCESS: All certificates obtained!"
        log "Certificates stored in: $CERT_DIR/conf"
    fi

    log "Setup complete. Run 'docker-compose up -d' to start services"
}

main "$@"