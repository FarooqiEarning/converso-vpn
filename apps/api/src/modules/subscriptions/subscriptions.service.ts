/**
 * Converso VPN - Subscriptions Service
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
  ) {}

  async findAllPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepository.find({
      where: { isActive: true },
      order: { priceMonthly: 'ASC' },
    });
  }

  async getUserSubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });
  }

  async createSubscription(
    userId: string,
    planId: string,
    stripeSubscriptionId: string,
    billingCycle: string,
  ): Promise<Subscription> {
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + (billingCycle === 'yearly' ? 12 : 1));

    const subscription = this.subscriptionRepository.create({
      userId,
      planId,
      status: SubscriptionStatus.ACTIVE,
      billingCycle: billingCycle as any,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      stripeSubscriptionId,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.CANCELED;
      subscription.canceledAt = new Date();
      await this.subscriptionRepository.save(subscription);
    }
  }

  async updateFromStripe(
    stripeSubscriptionId: string,
    status: string,
  ): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId },
    });

    if (subscription) {
      subscription.status = status as any;
      await this.subscriptionRepository.save(subscription);
    }
  }
}