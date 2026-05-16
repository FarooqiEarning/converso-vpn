/**
 * Converso VPN - Billing Service
 * Stripe integration for checkout and billing portal
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Payment, PaymentStatus, PaymentGateway } from './entities/payment.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { User } from '../users/entities/user.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Subscription)
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {
    this.stripe = new Stripe(this.configService.get('stripe.secretKey') || '', {
      apiVersion: '2023-10-16',
    });
  }

  async createCheckoutSession(
    userId: string,
    planId: string,
    billingCycle: 'monthly' | 'yearly' | 'lifetime',
  ): Promise<{ checkoutUrl: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const plan = await this.subscriptionsService.findAllPlans();
    const selectedPlan = plan.find((p) => p.id === planId);
    if (!selectedPlan) {
      throw new Error('Plan not found');
    }

    const priceId = billingCycle === 'yearly'
      ? selectedPlan.stripePriceYearlyId
      : selectedPlan.stripePriceMonthlyId;

    if (!priceId) {
      throw new Error('Stripe price not configured for this plan');
    }

    let customer: Stripe.Customer;
    if (user.email) {
      const customers = await this.stripe.customers.list({ email: user.email, limit: 1 });
      customer = customers.data[0] || await this.stripe.customers.create({ email: user.email });
    } else {
      customer = await this.stripe.customers.create({});
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.configService.get('app.frontendUrl')}/billing?success=true`,
      cancel_url: `${this.configService.get('app.frontendUrl')}/billing?canceled=true`,
      metadata: { userId, planId, billingCycle },
    });

    return { checkoutUrl: session.url || '' };
  }

  async createBillingPortalSession(userId: string): Promise<{ portalUrl: string }> {
    const subscription = await this.subscriptionsService.getUserSubscription(userId);
    if (!subscription?.stripeCustomerId) {
      throw new Error('No active subscription');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: this.configService.get('app.frontendUrl'),
    });

    return { portalUrl: session.url };
  }

  async handleWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<void> {
    const webhookSecret = this.configService.get('stripe.webhookSecret');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);
      throw new Error('Invalid signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutComplete(session);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdate(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeleted(subscription);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentSucceeded(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentFailed(invoice);
        break;
      }
    }
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    const metadata = session.metadata;
    if (!metadata?.userId || !metadata?.planId) return;

    const stripeSub = await this.stripe.subscriptions.retrieve(session.subscription as string);

    const sub = await this.subscriptionsService.createSubscription(
      metadata.userId,
      metadata.planId,
      stripeSub.id,
      metadata.billingCycle || 'monthly',
    );


    await this.createPaymentRecord(metadata.userId, {
      gatewayPaymentId: session.payment_intent as string,
      amount: (session.amount_total || 0) / 100,
      status: 'succeeded',
      subscriptionId: sub.id,
    });
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const statusMap: Record<Stripe.Subscription.Status, string> = {
      active: 'active',
      trialing: 'trialing',
      past_due: 'past_due',
      canceled: 'canceled',
      incomplete: 'active',
      incomplete_expired: 'expired',
      paused: 'active',
      unpaid: 'unpaid',
    };

    await this.subscriptionsService.updateFromStripe(
      subscription.id,
      statusMap[subscription.status] || 'active',
    );
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    await this.subscriptionsService.updateFromStripe(subscription.id, 'canceled');
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { gatewayPaymentId: invoice.payment_intent as string },
    });

    if (payment) {
      payment.status = PaymentStatus.SUCCEEDED;
      payment.paidAt = new Date();
      await this.paymentRepository.save(payment);
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { gatewayPaymentId: invoice.payment_intent as string },
    });

    if (payment) {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);
    }
  }

  private async createPaymentRecord(
    userId: string,
    data: {
      gatewayPaymentId: string;
      amount: number;
      status: string;
      subscriptionId?: string;
    },
  ): Promise<void> {
    const payment = this.paymentRepository.create({
      userId,
      amount: data.amount,
      currency: 'USD',
      status: data.status as any,
      gateway: PaymentGateway.STRIPE,
      gatewayPaymentId: data.gatewayPaymentId,
      subscriptionId: data.subscriptionId,
      paidAt: data.status === 'succeeded' ? new Date() : undefined,
    });

    await this.paymentRepository.save(payment);
  }

  async getPaymentHistory(userId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}