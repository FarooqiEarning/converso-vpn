/**
 * Converso VPN - WireGuard Module
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WireGuardController } from './wireguard.controller';
import { WireGuardService } from './wireguard.service';
import { WireGuardPeer } from './entities/wireguard-peer.entity';
import { Session } from './entities/session.entity';
import { VpnNode } from '../vpn-nodes/entities/vpn-node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WireGuardPeer, Session, VpnNode])],
  controllers: [WireGuardController],
  providers: [WireGuardService],
  exports: [WireGuardService],
})
export class WireGuardModule {}