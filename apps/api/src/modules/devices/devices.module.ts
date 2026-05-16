/**
 * Converso VPN - Devices Module
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { WireGuardPeer } from '../wireguard/entities/wireguard-peer.entity';
import { VpnNode } from '../vpn-nodes/entities/vpn-node.entity';
import { WireGuardModule } from '../wireguard/wireguard.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WireGuardPeer, VpnNode]),
    WireGuardModule,
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}