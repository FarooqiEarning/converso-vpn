/**
 * Converso VPN - Analytics Controller
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles('admin')
  @ApiOperation({ summary: 'Get platform overview (admin only)' })
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('revenue')
  @Roles('admin')
  @ApiOperation({ summary: 'Get revenue data (admin only)' })
  async getRevenue(@Query('days') days?: number) {
    return this.analyticsService.getRevenue(days);
  }
}