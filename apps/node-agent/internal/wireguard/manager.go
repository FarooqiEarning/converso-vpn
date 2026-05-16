package wireguard

import (
	"fmt"
	"net"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/vishvananda/netlink"
	"github.com/vishvananda/wgctrl"
	"github.com/vishvananda/wgctrl/wgtypes"
	"golang.org/x/crypto/curve25519"
)

type Peer struct {
	PublicKey       string
	PrivateKey      string
	PresharedKey    string
	AllowedIPs      []string
	Endpoint        string
	PersistentKeepalive int
	BytesReceived  uint64
	BytesSent       uint64
	LastHandshake   time.Time
}

type Manager struct {
	ifaceName string
	wg        wgctrl.Wg
	mu        sync.RWMutex
}

func NewManager(ifaceName string) (*Manager, error) {
	wg, err := wgctrl.New()
	if err != nil {
		return nil, fmt.Errorf("failed to create wgctrl: %w", err)
	}

	return &Manager{
		ifaceName: ifaceName,
		wg:        wg,
	}, nil
}

func (m *Manager) getDevice() (*wgctrl.Device, error) {
	device, err := m.wg.Device(m.ifaceName)
	if err != nil {
		return nil, fmt.Errorf("failed to get device %s: %w", m.ifaceName, err)
	}
	return device, nil
}

func (m *Manager) AddPeer(pubKey, privKey, presharedKey string, allowedIPs []string, endpoint string, keepalive int) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	privateKey, err := wgtypes.ParseKey(privKey)
	if err != nil {
		return fmt.Errorf("invalid private key: %w", err)
	}

	publicKey, err := wgtypes.ParseKey(pubKey)
	if err != nil {
		return fmt.Errorf("invalid public key: %w", err)
	}

	var presharedKeyVal wgtypes.Key
	if presharedKey != "" {
		presharedKeyVal, err = wgtypes.ParseKey(presharedKey)
		if err != nil {
			return fmt.Errorf("invalid preshared key: %w", err)
		}
	}

	parsedEndpoint, err := net.ResolveUDPAddr("udp", endpoint)
	if err != nil {
		return fmt.Errorf("invalid endpoint: %w", err)
	}

	peerConfig := wgtypes.PeerConfig{
		PublicKey:         publicKey,
		PrivateKey:        privateKey,
		PresharedKey:      presharedKeyVal,
		AllowedIPs:        parseIPs(allowedIPs),
		Endpoint:          parsedEndpoint,
		PersistentKeepalive: time.Duration(keepalive) * time.Second,
	}

	device, err := m.getDevice()
	if err != nil {
		return err
	}

	newPeers := append(device.Peers, peerConfig)

	if err := m.wg.ConfigureDevice(m.ifaceName, device.ListenPort, device.FirewallMark, newPeers); err != nil {
		return fmt.Errorf("failed to configure device: %w", err)
	}

	log.Info().Str("public_key", pubKey).Str("endpoint", endpoint).Msg("Peer added")
	return nil
}

func (m *Manager) RemovePeer(publicKey string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	pubKey, err := wgtypes.ParseKey(publicKey)
	if err != nil {
		return fmt.Errorf("invalid public key: %w", err)
	}

	device, err := m.getDevice()
	if err != nil {
		return err
	}

	var remainingPeers []wgtypes.PeerConfig
	for _, peer := range device.Peers {
		if peer.PublicKey != pubKey {
			remainingPeers = append(remainingPeers, wgtypes.PeerConfig{
				PublicKey: peer.PublicKey,
			})
		}
	}

	if err := m.wg.ConfigureDevice(m.ifaceName, device.ListenPort, device.FirewallMark, remainingPeers); err != nil {
		return fmt.Errorf("failed to configure device: %w", err)
	}

	log.Info().Str("public_key", publicKey).Msg("Peer removed")
	return nil
}

func (m *Manager) ListPeers() ([]Peer, error) {
	device, err := m.getDevice()
	if err != nil {
		return nil, err
	}

	peers := make([]Peer, len(device.Peers))
	for i, p := range device.Peers {
		peers[i] = Peer{
			PublicKey:       p.PublicKey.String(),
			AllowedIPs:      formatIPs(p.AllowedIPs),
			Endpoint:        p.Endpoint.String(),
			PersistentKeepalive: int(p.PersistentKeepalive.Seconds()),
			BytesReceived:  p.BytesReceived,
			BytesSent:       p.BytesSent,
			LastHandshake:   p.LastHandshakeTime,
		}
	}

	return peers, nil
}

func (m *Manager) GetPeerStats(publicKey string) (*Peer, error) {
	peers, err := m.ListPeers()
	if err != nil {
		return nil, err
	}

	for _, peer := range peers {
		if peer.PublicKey == publicKey {
			return &peer, nil
		}
	}

	return nil, fmt.Errorf("peer not found")
}

func (m *Manager) Close() error {
	return m.wg.Close()
}

func parseIPs(ips []string) []net.IPNet {
	var result []net.IPNet
	for _, ip := range ips {
		_, ipnet, err := net.ParseCIDR(ip)
		if err == nil {
			result = append(result, *ipnet)
		}
	}
	return result
}

func formatIPs(ips []net.IPNet) []string {
	result := make([]string, len(ips))
	for i, ip := range ips {
		result[i] = ip.String()
	}
	return result
}

func GenerateKeyPair() (privateKey, publicKey string, err error) {
	privateBytes := make([]byte, curve25519.SizeScalar)
	if _, err := curve25519.GenerateScalar(privateBytes); err != nil {
		return "", "", err
	}

	publicBytes, err := curve25519.ScalarBaseMult(privateBytes)
	if err != nil {
		return "", "", err
	}

	privateKey = wgtypes.Key(privateBytes).String()
	publicKey = wgtypes.Key(publicBytes).String()

	return privateKey, publicKey, nil
}