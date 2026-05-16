/**
 * Converso VPN - WireGuard Peer Entity
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { VpnNode } from '../../vpn-nodes/entities/vpn-node.entity';

export enum PeerStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  SUSPENDED = 'suspended',
}

export enum DeviceType {
  IOS = 'ios',
  ANDROID = 'android',
  WINDOWS = 'windows',
  MACOS = 'macos',
  LINUX = 'linux',
  ROUTER = 'router',
}

@Entity('wireguard_peers')
@Index('idx_wireguard_peers_user_id', ['userId'])
@Index('idx_wireguard_peers_node_id', ['nodeId'])
@Index('idx_wireguard_peers_status', ['status'])
@Unique('unique_node_assigned_ip', ['nodeId', 'assignedIp'])
@Unique('unique_node_public_key', ['nodeId', 'publicKey'])
export class WireGuardPeer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  nodeId: string;

  @ManyToOne(() => VpnNode)
  @JoinColumn({ name: 'nodeId' })
  node: VpnNode;

  @Column({ type: 'varchar', length: 100 })
  deviceName: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  deviceType: DeviceType | null;

  @Column({ type: 'text' })
  publicKey: string;

  @Column({ type: 'text' })
  privateKeyEncrypted: string;

  @Column({ type: 'text', nullable: true })
  presharedKeyEncrypted: string | null;

  @Column({ type: 'inet' })
  assignedIp: string;

  @Column({ type: 'text', array: true, default: ['1.1.1.1', '1.0.0.1'] })
  dnsServers: string[];

  @Column({ type: 'text', array: true, default: ['0.0.0.0/0', '::/0'] })
  allowedIps: string[];

  @Column({
    type: 'varchar',
    length: 20,
    default: PeerStatus.ACTIVE,
  })
  status: PeerStatus;

  @Column({ type: 'timestamptz', nullable: true })
  lastHandshakeAt: Date | null;

  @Column({ type: 'bigint', default: 0 })
  bytesSent: number;

  @Column({ type: 'bigint', default: 0 })
  bytesReceived: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}