package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
)

var (
	NodeInfo = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "converso_node_info",
			Help: "Node information",
		},
		[]string{"node_id", "node_name", "version"},
	)

	ActivePeers = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "converso_active_peers",
			Help: "Number of active peers",
		},
	)

	BytesReceived = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "converso_bytes_received_total",
			Help: "Total bytes received",
		},
	)

	BytesSent = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "converso_bytes_sent_total",
			Help: "Total bytes sent",
		},
	)

	CPUPercent = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "converso_cpu_percent",
			Help: "CPU usage percentage",
		},
	)

	MemoryPercent = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "converso_memory_percent",
			Help: "Memory usage percentage",
		},
	)
)

func UpdateNodeInfo(nodeID, nodeName, version string) {
	NodeInfo.WithLabelValues(nodeID, nodeName, version).Set(1)
}