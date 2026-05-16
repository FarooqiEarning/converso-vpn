#!/bin/bash
# =============================================================================
# File: renew-ssl.sh
# Purpose: Automated SSL certificate renewal with nginx reload
# =============================================================================

set -euo pipefail

CERT_DIR="/etc/letsencrypt"
WEBROOT_DIR="/var/www/certbot"
RENEWAL_LOG="/var/log/certbot-renewal.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [RENEWAL] $1" | tee -a "$RENEWAL_LOG"
}

reload_nginx() {
    log "Reloading nginx configuration..."
    if nginx -t 2>&1; then
        nginx -s reload 2>&1 || systemctl reload nginx 2>&1 || docker exec nginx nginx -s reload 2>&1
        log "Nginx reloaded successfully"
    else
        log "ERROR: Nginx configuration test failed, skipping reload"
        return 1
    fi
}

renew_certificates() {
    log "Starting certificate renewal check..."

    if certbot renew \
        --webroot \
        -w "$WEBROOT_DIR" \
        --non-interactive \
        --deploy-hook "nginx -s reload" \
        2>&1 | tee -a "$RENEWAL_LOG"; then
        log "Certificate renewal check completed"
    else
        log "Certificate renewal encountered errors, check logs"
    fi
}

main() {
    log "Certificate renewal process started"

    renew_certificates

    reload_nginx

    log "Certificate renewal process completed"
}

if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi