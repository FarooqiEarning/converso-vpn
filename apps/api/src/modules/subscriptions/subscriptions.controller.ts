/**
 * Converso VPN - Subscriptions Controller
 */

import {
  Controller,
  Get,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List all subscription plans' })
  async getPlans() {
    return this.subscriptionsService.findAllPlans();
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current subscription' })
  async getCurrent(@CurrentUser() user: User) {
    return this.subscriptionsService.getUserSubscription(user.id);
  }

  @Delete('current')
  @ApiOperation({ summary: 'Cancel current subscription' })
  async cancel(
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    const subscription = await this.subscriptionsService.getUserSubscription(user.id);
    if (subscription) {
      await this.subscriptionsService.cancelSubscription(subscription.id);
    }
    return { message: 'Subscription canceled' };
  }
}