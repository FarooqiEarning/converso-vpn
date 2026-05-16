/**
 * Converso VPN - Devices Module
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { WireGuardPeer } from '../wireguard/entities/wireguard-peer.entity';
import { VpnNode } from '../vpn-nodes/entities/vpn-node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WireGuardPeer, VpnNode])],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}