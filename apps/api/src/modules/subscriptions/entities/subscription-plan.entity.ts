/**
 * Converso VPN - Subscription Plan Entity
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('subscription_plans')
@Index('idx_plans_slug', ['slug'])
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  slug: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  priceMonthly: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  priceYearly: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  priceLifetime: number | null;

  @Column({ type: 'integer' })
  maxDevices: number;

  @Column({ type: 'integer', nullable: true })
  maxBandwidthGb: number | null;

  @Column({ type: 'jsonb', default: [] })
  features: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripePriceMonthlyId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripePriceYearlyId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}