package config

import (
	"fmt"
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

type Config struct {
	NodeName        string        `yaml:"node_name"`
	NodeID          string        `yaml:"node_id"`
	ControlPlaneURL string        `yaml:"control_plane_url"`
	AgentSecret     string        `yaml:"agent_secret"`
	HTTPPort        int           `yaml:"http_port"`
	GrpcPort        int           `yaml:"grpc_port"`
	HeartbeatInterval time.Duration `yaml:"heartbeat_interval"`
	WireGuardConfig WireGuardConfig `yaml:"wireguard"`
}

type WireGuardConfig struct {
	Interface string `yaml:"interface"`
	ListenPort int   `yaml:"listen_port"`
}

func Load() (*Config, error) {
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "/etc/converso-agent/config.yaml"
	}

	cfg := &Config{
		NodeName:        getEnv("NODE_NAME", "unknown-node"),
		NodeID:          getEnv("NODE_ID", ""),
		ControlPlaneURL: getEnv("CONTROL_PLANE_URL", "http://api:3000"),
		AgentSecret:     getEnv("AGENT_SECRET", ""),
		HTTPPort:        getEnvInt("HTTP_PORT", 9100),
		GrpcPort:        getEnvInt("GRPC_PORT", 50051),
		HeartbeatInterval: getEnvDuration("HEARTBEAT_INTERVAL", 30*time.Second),
		WireGuardConfig: WireGuardConfig{
			Interface: getEnv("WG_INTERFACE", "wg0"),
			ListenPort: getEnvInt("WG_LISTEN_PORT", 51820),
		},
	}

	if cfg.AgentSecret == "" {
		return nil, fmt.Errorf("AGENT_SECRET is required")
	}

	if cfg.NodeID == "" {
		return nil, fmt.Errorf("NODE_ID is required")
	}

	if _, err := os.Stat(configPath); err == nil {
		data, err := os.ReadFile(configPath)
		if err != nil {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
		if err := yaml.Unmarshal(data, cfg); err != nil {
			return nil, fmt.Errorf("failed to parse config file: %w", err)
		}
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		var intVal int
		if _, err := fmt.Sscanf(value, "%d", &intVal); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if d, err := time.ParseDuration(value); err == nil {
			return d
		}
	}
	return defaultValue
}