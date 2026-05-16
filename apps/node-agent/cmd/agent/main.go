package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"

	"github.com/converso/node-agent/internal/config"
	"github.com/converso/node-agent/internal/health"
	"github.com/converso/node-agent/internal/metrics"
	"github.com/converso/node-agent/internal/wireguard"
)

var (
	version   = "1.0.0"
	buildTime = "unknown"
)

func main() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load configuration")
	}

	log.Info().
		Str("version", version).
		Str("build_time", buildTime).
		Str("node_name", cfg.NodeName).
		Msg("Starting Converso VPN Node Agent")

	prometheus.MustRegister(metrics.NodeInfo)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	wgManager, err := wireguard.NewManager(cfg.WireGuardInterface)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize WireGuard manager")
	}

	registration := NewRegistration(cfg, wgManager)
	if err := registration.Register(ctx); err != nil {
		log.Fatal().Err(err).Msg("Failed to register with control plane")
	}

	heartbeat := NewHeartbeat(cfg, wgManager)
	go heartbeat.Start(ctx)

	grpcServer := NewGrpcServer(cfg, wgManager)
	go func() {
		if err := grpcServer.Start(); err != nil {
			log.Error().Err(err).Msg("gRPC server error")
		}
	}()

	mux := http.NewServeMux()
	mux.HandleFunc("/health", health.Handler)
	mux.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		promhttp.Handler().ServeHTTP(w, r)
	})
	mux.HandleFunc("/ peers", func(w http.ResponseWriter, r *http.Request) {
		peers, err := wgManager.ListPeers()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, "%+v", peers)
	})

	httpServer := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.HTTPPort),
		Handler: mux,
	}

	go func() {
		log.Info().Int("port", cfg.HTTPPort).Msg("HTTP server starting")
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error().Err(err).Msg("HTTP server error")
		}
	}()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Info().Msg("Shutting down gracefully...")
	cancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Error().Err(err).Msg("HTTP server shutdown error")
	}

	grpcServer.Stop()
	log.Info().Msg("Node agent stopped")
}