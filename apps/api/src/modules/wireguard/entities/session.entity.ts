/**
 * Converso VPN - Session Entity
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WireGuardPeer } from './wireguard-peer.entity';

@Entity('sessions')
@Index('idx_sessions_user_id', ['userId'])
@Index('idx_sessions_connected_at', ['connectedAt'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  peerId: string | null;

  @ManyToOne(() => WireGuardPeer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'peerId' })
  peer: WireGuardPeer | null;

  @Column({ type: 'timestamptz' })
  connectedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  disconnectedAt: Date | null;

  @Column({ type: 'integer', nullable: true })
  durationSeconds: number | null;

  @Column({ type: 'bigint', default: 0 })
  bytesSent: number;

  @Column({ type: 'bigint', default: 0 })
  bytesReceived: number;

  @Column({ type: 'inet', nullable: true })
  clientIp: string | null;

  @Column({ type: 'inet', nullable: true })
  exitIp: string | null;

  @Column({ type: 'varchar', length: 20, default: 'wireguard' })
  protocol: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}