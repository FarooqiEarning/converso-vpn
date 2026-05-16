/**
 * Converso VPN - Payment Entity
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
import { Subscription } from '../../subscriptions/entities/subscription.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentGateway {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  CRYPTO = 'crypto',
}

@Entity('payments')
@Index('idx_payments_user_id', ['userId'])
@Index('idx_payments_status', ['status'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  subscriptionId: string | null;

  @ManyToOne(() => Subscription, { nullable: true })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription | null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'char', length: 3, default: 'USD' })
  currency: string;

  @Column({
    type: 'varchar',
    length: 30,
  })
  status: PaymentStatus;

  @Column({
    type: 'varchar',
    length: 30,
  })
  gateway: PaymentGateway;

  @Column({ type: 'varchar', length: 255, unique: true })
  gatewayPaymentId: string;

  @Column({ type: 'jsonb', nullable: true })
  gatewayResponse: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  refundedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}