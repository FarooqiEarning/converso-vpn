/**
 * Converso VPN - Analytics Service
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Subscription, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { Payment, PaymentStatus } from '../billing/entities/payment.entity';
import { VpnNode, NodeStatus } from '../vpn-nodes/entities/vpn-node.entity';

export interface OverviewStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  activeNodes: number;
  activePeers: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(VpnNode)
    private readonly nodeRepository: Repository<VpnNode>,
  ) {}

  async getOverview(): Promise<OverviewStats> {
    const [totalUsers, activeSubscriptions, revenueResult, activeNodes, peersResult] = await Promise.all([
      this.userRepository.count(),
      this.subscriptionRepository.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.status = :status', { status: PaymentStatus.SUCCEEDED })
        .getRawOne(),
      this.nodeRepository.count({ where: { status: NodeStatus.ONLINE } }),
      this.userRepository.manager.query(`
        SELECT COALESCE(SUM(current_peers), 0) as total FROM vpn_nodes WHERE status = 'online'
      `),
    ]);

    return {
      totalUsers,
      activeSubscriptions,
      totalRevenue: parseFloat(revenueResult?.total || '0'),
      activeNodes,
      activePeers: parseInt(peersResult[0]?.total || '0', 10),
    };
  }

  async getRevenue(days: number = 30): Promise<RevenueData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('DATE(payment.createdAt)', 'date')
      .addSelect('SUM(payment.amount)', 'revenue')
      .where('payment.status = :status', { status: PaymentStatus.SUCCEEDED })
      .andWhere('payment.createdAt >= :startDate', { startDate })
      .groupBy('DATE(payment.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return result;
  }
}