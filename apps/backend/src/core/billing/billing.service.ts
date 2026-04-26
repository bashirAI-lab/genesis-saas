import { Injectable, Logger } from '@nestjs/common';
import { TenantService } from '../tenant/tenant.service';
import { TenantStatus } from '../tenant/tenant.entity';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly tenantService: TenantService) {}

  /**
   * Handle incoming Stripe webhooks for subscription management.
   */
  async handleStripeWebhook(event: any): Promise<void> {
    this.logger.log(`Received Stripe Webhook: ${event.type}`);

    // In a real app, verify Stripe signature here...
    const dataObject = event.data.object;
    
    // We assume we save the tenantId in Stripe Customer Metadata
    const tenantId = dataObject.metadata?.tenantId; 

    if (!tenantId) {
      this.logger.warn('Stripe webhook received but no tenantId metadata found. Ignoring.');
      return;
    }

    switch (event.type) {
      case 'invoice.payment_succeeded':
        // Subscription paid or renewed
        await this.handlePaymentSucceeded(tenantId, dataObject);
        break;

      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
        // Subscription cancelled or payment failed for too long
        await this.handleSubscriptionSuspended(tenantId);
        break;
        
      case 'customer.subscription.updated':
        // Plan tier upgrades/downgrades
        await this.handleSubscriptionUpdated(tenantId, dataObject);
        break;

      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handlePaymentSucceeded(tenantId: string, invoice: any) {
    // Determine the new expiration date (e.g., 30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.tenantService.update(tenantId, {
      subscriptionExpiresAt: expiresAt,
      // Reactivate if it was suspended due to billing
      status: TenantStatus.ACTIVE, 
    });

    this.logger.log(`Tenant ${tenantId} payment succeeded. Access extended to ${expiresAt}`);
  }

  private async handleSubscriptionSuspended(tenantId: string) {
    await this.tenantService.update(tenantId, {
      status: TenantStatus.SUSPENDED,
      // Leave an audit trail in settings or note
    });

    // Important: Calling suspend on TenantService drops all connections in the ConnectionManager
    await this.tenantService.suspend(tenantId);
    
    this.logger.log(`Tenant ${tenantId} subscription cancelled. Tenant suspended.`);
  }

  private async handleSubscriptionUpdated(tenantId: string, subscription: any) {
    // Map Stripe Price ID to your internal plan tiers (e.g., prod_xyz -> gold)
    const priceId = subscription.items?.data[0]?.price?.id;
    let newPlan = 'free';

    if (priceId === 'price_gold_tier') newPlan = 'gold';
    else if (priceId === 'price_silver_tier') newPlan = 'silver';
    else if (priceId === 'price_enterprise_tier') newPlan = 'enterprise';

    await this.tenantService.update(tenantId, {
      subscriptionPlan: newPlan,
    });

    this.logger.log(`Tenant ${tenantId} plan updated to ${newPlan}`);
  }
}
