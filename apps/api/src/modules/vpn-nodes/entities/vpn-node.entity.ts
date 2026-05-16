/**
 * Converso VPN - VPN Node Entity
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NodeStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  DEGRADED = 'degraded',
}

export enum NodeTier {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  STREAMING = 'streaming',
}

@Entity('vpn_nodes')
@Index('idx_vpn_nodes_country_code', ['countryCode'])
@Index('idx_vpn_nodes_status', ['status'])
export class VpnNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  hostname: string;

  @Column({ type: 'char', length: 2 })
  countryCode: string;

  @Column({ type: 'varchar', length: 100 })
  countryName: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'inet' })
  ipAddress: string;

  @Column({ type: 'text' })
  publicKey: string;

  @Column({ type: 'varchar', length: 255 })
  endpoint: string;

  @Column({ type: 'integer', default: 51820 })
  listenPort: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: NodeStatus.OFFLINE,
  })
  status: NodeStatus;

  @Column({
    type: 'varchar',
    length: 20,
    default: NodeTier.STANDARD,
  })
  tier: NodeTier;

  @Column({ type: 'integer', default: 500 })
  maxPeers: number;

  @Column({ type: 'integer', default: 0 })
  currentPeers: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  loadPercent: number;

  @Column({ type: 'integer', nullable: true })
  pingMs: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  bandwidthInMbps: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  bandwidthOutMbps: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  provider: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  monthlyCostUsd: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastHeartbeatAt: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  agentVersion: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}