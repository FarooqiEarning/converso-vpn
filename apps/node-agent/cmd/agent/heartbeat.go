package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/mem"
	"golang.org/x/net/icmp"

	"github.com/converso/node-agent/internal/config"
	"github.com/converso/node-agent/internal/metrics"
	"github.com/converso/node-agent/internal/wireguard"
)

type Heartbeat struct {
	cfg       *config.Config
	wgManager *wireguard.Manager
	client    *http.Client
}

func NewHeartbeat(cfg *config.Config, wgManager *wireguard.Manager) *Heartbeat {
	return &Heartbeat{
		cfg:       cfg,
		wgManager: wgManager,
		client:    &http.Client{Timeout: 10 * time.Second},
	}
}

type HeartbeatRequest struct {
	NodeID           string  `json:"node_id"`
	CPUPercent       float64 `json:"cpu_percent"`
	MemoryPercent    float64 `json:"memory_percent"`
	ActivePeers      int     `json:"active_peers"`
	BytesReceived    uint64  `json:"bytes_received"`
	BytesSent        uint64  `json:"bytes_sent"`
	PingMs           int     `json:"ping_ms"`
	BandwidthInMbps  float64 `json:"bandwidth_in_mbps"`
	BandwidthOutMbps float64 `json:"bandwidth_out_mbps"`
}

func (h *Heartbeat) Start(ctx context.Context) {
	ticker := time.NewTicker(h.cfg.HeartbeatInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Info().Msg("Heartbeat stopped")
			return
		case <-ticker.C:
			h.sendHeartbeat(ctx)
		}
	}
}

func (h *Heartbeat) sendHeartbeat(ctx context.Context) {
	peers, err := h.wgManager.ListPeers()
	if err != nil {
		log.Error().Err(err).Msg("Failed to get peers")
		return
	}

	var totalRx, totalTx uint64
	for _, p := range peers {
		totalRx += p.BytesReceived
		totalTx += p.BytesSent
	}

	cpuPercent, _ := cpu.Percent(0, nil)
	memInfo, _ := mem.VirtualMemory()
	pingMs := h.measurePing()

	bandwidthIn := float64(totalRx) / (h.cfg.HeartbeatInterval.Seconds() * 1024 * 1024 / 8)
	bandwidthOut := float64(totalTx) / (h.cfg.HeartbeatInterval.Seconds() * 1024 * 1024 / 8)

	metrics.ActivePeers.Set(float64(len(peers)))
	metrics.BytesReceived.Add(float64(totalRx))
	metrics.BytesSent.Add(float64(totalTx))

	if len(cpuPercent) > 0 {
		metrics.CPUPercent.Set(cpuPercent[0])
	}
	metrics.MemoryPercent.Set(memInfo.UsedPercent)

	reqBody := HeartbeatRequest{
		NodeID:           h.cfg.NodeID,
		CPUPercent:       cpuPercent[0],
		MemoryPercent:    memInfo.UsedPercent,
		ActivePeers:      len(peers),
		BytesReceived:    totalRx,
		BytesSent:        totalTx,
		PingMs:           pingMs,
		BandwidthInMbps:  bandwidthIn,
		BandwidthOutMbps: bandwidthOut,
	}

	body, _ := json.Marshal(reqBody)

	httpReq, err := http.NewRequestWithContext(ctx, "POST",
		h.cfg.ControlPlaneURL+"/v1/internal/nodes/heartbeat",
		bytes.NewBuffer(body))
	if err != nil {
		log.Error().Err(err).Msg("Failed to create heartbeat request")
		return
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("X-Agent-Secret", h.cfg.AgentSecret)

	resp, err := h.client.Do(httpReq)
	if err != nil {
		log.Error().Err(err).Msg("Failed to send heartbeat")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Warn().Int("status", resp.StatusCode).Msg("Heartbeat response not OK")
	}

	log.Debug().
		Int("peers", len(peers)).
		Float64("cpu", cpuPercent[0]).
		Msg("Heartbeat sent")
}

func (h *Heartbeat) measurePing() int {
	conn, err := icmp.ListenPacket("ip4:1", "")
	if err != nil {
		return -1
	}
	defer conn.Close()

	dst, _ := net.ResolveUDPAddr("udp", "1.1.1.1:53")
	msg := icmp.Message{
		Type: ipv4ICMPTypeEchoRequest,
		Code: 0,
		Body: &icmp.Echo{
			ID:  h.cfg.NodeID[0:8],
			Seq: 1,
			Data: []byte("ping"),
		},
	}

	start := time.Now()
	if _, err := msg.WriteTo(conn, dst); err != nil {
		return -1
	}

	reply := make([]byte, 1500)
	conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	n, _, err := conn.ReadFrom(reply)
	if err != nil {
		return -1
	}

	elapsed := time.Since(start).Milliseconds()
	if n > 0 {
		return int(elapsed)
	}

	return -1
}

var ipv4ICMPTypeEchoRequest = 8