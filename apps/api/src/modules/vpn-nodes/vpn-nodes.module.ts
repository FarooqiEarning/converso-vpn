/**
 * Converso VPN - VPN Nodes Module
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VpnNodesController } from './vpn-nodes.controller';
import { VpnNodesService } from './vpn-nodes.service';
import { VpnNode } from './entities/vpn-node.entity';
import { NodeMetric } from './entities/node-metric.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VpnNode, NodeMetric])],
  controllers: [VpnNodesController],
  providers: [VpnNodesService],
  exports: [VpnNodesService],
})
export class VpnNodesModule {}