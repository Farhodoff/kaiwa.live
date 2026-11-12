export type PaymentGateway = 'payme' | 'click' | 'stripe';

export interface CheckoutSessionRequest {
  planId: 'monthly' | 'yearly' | 'lifetime';
  gateway: PaymentGateway;
  userId: string;
  userEmail: string;
  returnUrl: string;
}

export interface WebhookEventPayload {
  transactionId: string;
  gateway: PaymentGateway;
  status: 'pending' | 'success' | 'failed';
  amount: number;
  currency: 'UZS' | 'USD';
  timestamp: number;
}
