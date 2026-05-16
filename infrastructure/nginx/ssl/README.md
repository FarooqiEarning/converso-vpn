# SSL Certificates

Place your SSL certificates here:

- `server.crt` - SSL certificate
- `server.key` - Private key

## Generate self-signed for development:
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key -out server.crt \
  -subj "/C=US/ST=State/L=City/O=Converso"
```

## For production, use Let's Encrypt or purchase from a CA.