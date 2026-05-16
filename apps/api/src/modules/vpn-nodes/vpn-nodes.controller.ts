/**
 * Converso VPN - VPN Nodes Controller
 */

import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VpnNodesService } from './vpn-nodes.service';

@ApiTags('nodes')
@Controller('nodes')
export class VpnNodesController {
  constructor(private readonly vpnNodesService: VpnNodesService) {}

  @Get()
  @ApiOperation({ summary: 'List all available nodes' })
  async findAll() {
    return this.vpnNodesService.findAll();
  }

  @Get('recommend')
  @ApiOperation({ summary: 'Get recommended nodes by latency' })
  @ApiQuery({ name: 'latency', required: false, type: Number })
  async getRecommended(@Query('latency') latency?: number) {
    return this.vpnNodesService.getRecommendedNodes(latency);
  }

  @Get('countries')
  @ApiOperation({ summary: 'Get list of countries with nodes' })
  async getCountries() {
    return this.vpnNodesService.getCountries();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get node by ID' })
  async findById(@Param('id') id: string) {
    return this.vpnNodesService.findById(id);
  }
}