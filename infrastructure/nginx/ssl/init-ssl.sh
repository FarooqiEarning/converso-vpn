#!/bin/bash
# =============================================================================
# File: init-ssl.sh
# Purpose: Initialize SSL certificates for all domains using Certbot
# =============================================================================

set -euo pipefail

DOMAINS=(
    "vpn.conversoempire.world"
    "app.vpn.conversoempire.world"
    "admin.vpn.conversoempire.world"
    "api.vpn.conversoempire.world"
)

CERTBOT_EMAIL="${CERTBOT_EMAIL:-owner@conversoempire.world}"
CERT_DIR="/etc/letsencrypt"
WEBROOT_DIR="/var/www/certbot"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

verify_prerequisites() {
    if ! command -v certbot &> /dev/null && ! docker info &> /dev/null; then
        error_exit "Neither certbot nor Docker is available"
    fi

    if [ ! -d "$CERT_DIR" ]; then
        log "Creating certbot directories..."
        mkdir -p "$CERT_DIR" "$WEBROOT_DIR"
    fi
}

obtain_certificate() {
    local domain="$1"
    local email="$2"

    log "Obtaining certificate for: $domain"

    if certbot certonly \
        --webroot \
        -w "$WEBROOT_DIR" \
        -d "$domain" \
        --email "$email" \
        --agree-tos \
        --non-interactive \
        --keep-until-expiring \
        2>&1; then
        log "Certificate obtained successfully for: $domain"
        return 0
    else
        log "Failed to obtain certificate for: $domain"
        return 1
    fi
}

copy_certificates() {
    local domain="$1"
    local source_dir="$CERT_DIR/live/$domain"

    if [ -d "$source_dir" ]; then
        log "Copying certificates for: $domain"
        return 0
    fi
    return 1
}

main() {
    log "Starting SSL initialization for ${#DOMAINS[@]} domains"
    log "Email: $CERTBOT_EMAIL"

    verify_prerequisites

    local failed_domains=()

    for domain in "${DOMAINS[@]}"; do
        if ! obtain_certificate "$domain" "$CERTBOT_EMAIL"; then
            failed_domains+=("$domain")
        fi
    done

    if [ ${#failed_domains[@]} -gt 0 ]; then
        log "Failed to obtain certificates for: ${failed_domains[*]}"
        log "Will retry on next run or use staging mode"
    else
        log "All certificates obtained successfully!"
    fi

    log "SSL initialization complete"
    log "Certificates stored in: $CERT_DIR"
}

if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi