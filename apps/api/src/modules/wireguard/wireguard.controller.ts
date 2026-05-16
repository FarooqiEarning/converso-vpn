/**
 * Converso VPN - WireGuard Controller
 */

import {
  Controller,
  Get,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WireGuardService } from './wireguard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('wireguard')
@Controller('wireguard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WireGuardController {
  constructor(private readonly wireGuardService: WireGuardService) { }

  @Get('config/:peerId')
  @ApiOperation({ summary: 'Get peer WireGuard config' })
  async getConfig(@Param('peerId') peerId: string) {
    return this.wireGuardService.generateConfig(peerId);
  }

  @Get('config/:peerId/download')
  @ApiOperation({ summary: 'Download WireGuard config file' })
  async downloadConfig(
    @Param('peerId') peerId: string,
    @Res() res: Response,
  ) {
    const config = await this.wireGuardService.generateConfig(peerId);
    const configStr = this.wireGuardService.generateConfigFile(config);

    res.setHeader('Content-Type', 'application/x-wireguard');
    res.setHeader('Content-Disposition', `attachment; filename="converso-vpn.conf"`);
    res.send(configStr);
  }

  @Get('qr/:peerId')
  @ApiOperation({ summary: 'Generate QR code for peer' })
  async getQRCode(
    @Param('peerId') peerId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.wireGuardService.generateQRCode(peerId);
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  }
}