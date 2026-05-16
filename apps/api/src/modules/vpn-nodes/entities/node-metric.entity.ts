/**
 * Converso VPN - Node Metrics Entity
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VpnNode } from './vpn-node.entity';

@Entity('node_metrics')
@Index('idx_node_metrics_node_recorded', ['nodeId', 'recordedAt'])
export class NodeMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  nodeId: string;

  @ManyToOne(() => VpnNode, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nodeId' })
  node: VpnNode;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  recordedAt: Date;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  cpuPercent: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  memoryPercent: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  diskPercent: number | null;

  @Column({ type: 'integer', nullable: true })
  activePeers: number | null;

  @Column({ type: 'integer', nullable: true })
  pingMs: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  packetLoss: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  bandwidthInMbps: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  bandwidthOutMbps: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  loadAvg1m: number | null;
}