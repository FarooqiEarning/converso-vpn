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
git clone https://github.com/FarooqiEarning/convrerso-vpn.git || (cd converso-vpn && git pull)
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