import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { BillingService } from './billing.service';

/**
 * Billing Controller — Platform-level webhook endpoints.
 * Note: These endpoints must be public so Stripe can reach them.
 * 
 * Routes: /api/v1/billing
 */
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Body() payload: any,
    @Headers('stripe-signature') signature: string,
  ) {
    // Pass raw payload / signature to the service for validation
    // In our mock, we just process the JSON payload immediately.
    await this.billingService.handleStripeWebhook(payload);
    
    // Always return 200 OK so Stripe knows we received the event
    return { received: true };
  }
}
