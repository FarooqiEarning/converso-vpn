package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/vishvananda/netlink"

	"github.com/converso/node-agent/internal/config"
	"github.com/converso/node-agent/internal/metrics"
	"github.com/converso/node-agent/internal/wireguard"
)

type Registration struct {
	cfg        *config.Config
	wgManager  *wireguard.Manager
}

func NewRegistration(cfg *config.Config, wgManager *wireguard.Manager) *Registration {
	return &Registration{cfg: cfg, wgManager: wgManager}
}

type RegisterRequest struct {
	NodeID          string `json:"node_id"`
	NodeName        string `json:"node_name"`
	PublicKey       string `json:"public_key"`
	Endpoint        string `json:"endpoint"`
	ListenPort      int    `json:"listen_port"`
	AgentVersion    string `json:"agent_version"`
}

func (r *Registration) Register(ctx context.Context) error {
	privateKey, publicKey, err := wireguard.GenerateKeyPair()
	if err != nil {
		return fmt.Errorf("failed to generate keys: %w", err)
	}

	link, err := netlink.LinkByName(r.cfg.WireGuardConfig.Interface)
	if err != nil {
		return fmt.Errorf("failed to get wireguard interface: %w", err)
	}

	endpoint := fmt.Sprintf("%s:%d", r.cfg.NodeName, r.cfg.WireGuardConfig.ListenPort)

	reqBody := RegisterRequest{
		NodeID:       r.cfg.NodeID,
		NodeName:     r.cfg.NodeName,
		PublicKey:    publicKey,
		Endpoint:     endpoint,
		ListenPort:   r.cfg.WireGuardConfig.ListenPort,
		AgentVersion: version,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST",
		r.cfg.ControlPlaneURL+"/v1/internal/nodes/register",
		bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("X-Agent-Secret", r.cfg.AgentSecret)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("failed to register: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("registration failed with status: %d", resp.StatusCode)
	}

	log.Info().Str("node_id", r.cfg.NodeID).Str("public_key", publicKey).Msg("Registered with control plane")

	if err := r.configureWireguard(privateKey, link); err != nil {
		return fmt.Errorf("failed to configure wireguard: %w", err)
	}

	metrics.UpdateNodeInfo(r.cfg.NodeID, r.cfg.NodeName, version)

	return nil
}

func (r *Registration) configureWireguard(privateKey string, link netlink.Link) error {
	if err := netlink.LinkSetPrivateKey(link, privateKey); err != nil {
		return fmt.Errorf("failed to set private key: %w", err)
	}

	if err := netlink.LinkSetMTU(link, 1420); err != nil {
		return fmt.Errorf("failed to set MTU: %w", err)
	}

	if err := netlink.LinkSetUp(link); err != nil {
		return fmt.Errorf("failed to bring up interface: %w", err)
	}

	log.Info().Str("interface", r.cfg.WireGuardConfig.Interface).Msg("WireGuard interface configured")
	return nil
}