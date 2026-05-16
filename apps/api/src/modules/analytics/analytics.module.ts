/**
 * Converso VPN - Analytics Module
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { User } from '../users/entities/user.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Payment } from '../billing/entities/payment.entity';
import { VpnNode } from '../vpn-nodes/entities/vpn-node.entity';
import { WireGuardPeer } from '../wireguard/entities/wireguard-peer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Subscription, Payment, VpnNode, WireGuardPeer])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}