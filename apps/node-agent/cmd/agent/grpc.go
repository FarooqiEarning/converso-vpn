package main

import (
	"fmt"
	"net"

	"google.golang.org/grpc"

	"github.com/converso/node-agent/internal/config"
	"github.com/converso/node-agent/internal/wireguard"
	pb "github.com/converso/node-agent/proto"
)

type GrpcServer struct {
	cfg        *config.Config
	wgManager  *wireguard.Manager
	listener   net.Listener
	server     *grpc.Server
}

func NewGrpcServer(cfg *config.Config, wgManager *wireguard.Manager) *GrpcServer {
	return &GrpcServer{cfg: cfg, wgManager: wgManager}
}

func (s *GrpcServer) Start() error {
	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", s.cfg.GrpcPort))
	if err != nil {
		return fmt.Errorf("failed to listen: %w", err)
	}
	s.listener = lis

	s.server = grpc.NewServer()
	pb.RegisterAgentServer(s.server, &agentServer{wgManager: s.wgManager})

	log.Info().Int("port", s.cfg.GrpcPort).Msg("gRPC server starting")
	return s.server.Serve(lis)
}

func (s *GrpcServer) Stop() {
	if s.server != nil {
		s.server.GracefulStop()
	}
}

type agentServer struct {
	pb.UnimplementedAgentServer
	wgManager *wireguard.Manager
}

func (s *agentServer) AddPeer(ctx context.Context, req *pb.AddPeerRequest) (*pb.AddPeerResponse, error) {
	err := s.wgManager.AddPeer(
		req.PublicKey,
		req.PrivateKey,
		req.PresharedKey,
		req.AllowedIps,
		req.Endpoint,
		int(req.Keepalive),
	)
	if err != nil {
		return &pb.AddPeerResponse{Success: false, Error: err.Error()}, nil
	}
	return &pb.AddPeerResponse{Success: true}, nil
}

func (s *agentServer) RemovePeer(ctx context.Context, req *pb.RemovePeerRequest) (*pb.RemovePeerResponse, error) {
	err := s.wgManager.RemovePeer(req.PublicKey)
	if err != nil {
		return &pb.RemovePeerResponse{Success: false, Error: err.Error()}, nil
	}
	return &pb.RemovePeerResponse{Success: true}, nil
}

func (s *agentServer) GetPeerStats(ctx context.Context, req *pb.GetPeerStatsRequest) (*pb.PeerStatsResponse, error) {
	peer, err := s.wgManager.GetPeerStats(req.PublicKey)
	if err != nil {
		return nil, err
	}
	return &pb.PeerStatsResponse{
		PublicKey:       peer.PublicKey,
		BytesReceived:   peer.BytesReceived,
		BytesSent:       peer.BytesSent,
		LastHandshake:   peer.LastHandshake.Unix(),
		Endpoint:        peer.Endpoint,
		AllowedIps:      peer.AllowedIPs,
	}, nil
}

func (s *agentServer) HealthCheck(ctx context.Context, req *pb.HealthCheckRequest) (*pb.HealthCheckResponse, error) {
	peers, err := s.wgManager.ListPeers()
	if err != nil {
		return &pb.HealthCheckResponse{Status: "unhealthy", Error: err.Error()}, nil
	}
	return &pb.HealthCheckResponse{
		Status:      "healthy",
		ActivePeers: int32(len(peers)),
	}, nil
}