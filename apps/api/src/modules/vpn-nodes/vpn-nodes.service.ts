/**
 * Converso VPN - VPN Nodes Service
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { VpnNode, NodeStatus } from './entities/vpn-node.entity';
import { NodeMetric } from './entities/node-metric.entity';

@Injectable()
export class VpnNodesService {


  constructor(
    @InjectRepository(VpnNode)
    private readonly nodeRepository: Repository<VpnNode>,
    @InjectRepository(NodeMetric)
    private readonly metricRepository: Repository<NodeMetric>,
  ) {}

  async findAll(): Promise<VpnNode[]> {
    return this.nodeRepository.find({
      where: { status: In([NodeStatus.ONLINE, NodeStatus.DEGRADED]) },
      order: { countryCode: 'ASC', city: 'ASC' },
    });
  }

  async findById(id: string): Promise<VpnNode> {
    const node = await this.nodeRepository.findOne({ where: { id } });
    if (!node) {
      throw new NotFoundException('Node not found');
    }
    return node;
  }

  async getRecommendedNodes(latency?: number): Promise<VpnNode[]> {
    const nodes = await this.nodeRepository.find({
      where: { status: In([NodeStatus.ONLINE, NodeStatus.DEGRADED]) },
      order: { pingMs: 'ASC', loadPercent: 'ASC' },
      take: 5,
    });

    if (latency !== undefined) {
      return nodes.filter((n) => n.pingMs && n.pingMs < latency * 1.5);
    }

    return nodes;
  }

  async getCountries(): Promise<{ countryCode: string; countryName: string; nodeCount: number }[]> {
    const result = await this.nodeRepository
      .createQueryBuilder('node')
      .select('node.countryCode', 'countryCode')
      .addSelect('node.countryName', 'countryName')
      .addSelect('COUNT(*)', 'nodeCount')
      .where('node.status IN (:...statuses)', { statuses: [NodeStatus.ONLINE, NodeStatus.DEGRADED] })
      .groupBy('node.countryCode')
      .addGroupBy('node.countryName')
      .getRawMany();

    return result;
  }

  async updateHeartbeat(
    nodeId: string,
    metrics: {
      cpuPercent?: number;
      memoryPercent?: number;
      activePeers?: number;
      pingMs?: number;
      bandwidthInMbps?: number;
      bandwidthOutMbps?: number;
    },
  ): Promise<void> {
    const node = await this.findById(nodeId);

    node.lastHeartbeatAt = new Date();
    node.currentPeers = metrics.activePeers ?? node.currentPeers;
    node.pingMs = metrics.pingMs ?? node.pingMs;
    node.bandwidthInMbps = metrics.bandwidthInMbps ?? node.bandwidthInMbps;
    node.bandwidthOutMbps = metrics.bandwidthOutMbps ?? node.bandwidthOutMbps;

    if (node.maxPeers > 0) {
      node.loadPercent = (node.currentPeers / node.maxPeers) * 100;
    }

    if (metrics.cpuPercent !== undefined) {
      const metric = this.metricRepository.create({
        nodeId: node.id,
        cpuPercent: metrics.cpuPercent,
        memoryPercent: metrics.memoryPercent,
        activePeers: metrics.activePeers,
        pingMs: metrics.pingMs,
        bandwidthInMbps: metrics.bandwidthInMbps,
        bandwidthOutMbps: metrics.bandwidthOutMbps,
      });
      await this.metricRepository.save(metric);
    }

    await this.nodeRepository.save(node);
  }

  async createNode(data: Partial<VpnNode>): Promise<VpnNode> {
    const node = this.nodeRepository.create(data);
    return this.nodeRepository.save(node);
  }

  async updateNode(id: string, data: Partial<VpnNode>): Promise<VpnNode> {
    const node = await this.findById(id);
    Object.assign(node, data);
    return this.nodeRepository.save(node);
  }

  async deleteNode(id: string): Promise<void> {
    const node = await this.findById(id);
    await this.nodeRepository.remove(node);
  }
}