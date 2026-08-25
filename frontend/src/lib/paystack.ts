import { billingApi } from '@/api/endpoints';

/**
 * Subscription checkout bridge.
 *
 * Creates a pending charge on the backend, then hands off to the gateway.
 * M-Pesa / Card / Bank are collected through Paystack (they all settle into
 * the app owner's Paystack balance — that is how subscription fees reach you).
 * PayPal records a pending invoice which the owner confirms in the admin
 * dashboard until a PayPal business integration is added.
 *
 * To go live: create a Paystack business account, take your SECRET key into
 * backend/.env as PAYSTACK_SECRET_KEY, put your PUBLIC key below, and swap the
 * demo resolve for PaystackPop.setup({ key, email, amount, currency: 'KES',
 * channels: ['mobile_money' | 'card' | 'bank_transfer'] }).openIframe().
 */

export type CheckoutMethod = 'MPESA' | 'CARD' | 'BANK' | 'PAYPAL';

export interface CheckoutSession {
  email: string;
  planId: string;
  planName: string;
  /** Amount in whole shillings */
  amountKes: number;
  method: CheckoutMethod;
}

export interface CheckoutResult {
  reference: string;
}

const PAYSTACK_PUBLIC_KEY = ''; // e.g. 'pk_test_xxx' / 'pk_live_xxx'

export async function startCheckout(session: CheckoutSession): Promise<CheckoutResult> {
  const { reference } = await billingApi.initiate(session.planId, session.method);

  if (session.method === 'PAYPAL') {
    // Pending invoice — owner confirms manually from the admin dashboard.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return { reference };
  }

  if (PAYSTACK_PUBLIC_KEY) {
    await loadPaystackInline();
    return new Promise<CheckoutResult>((resolve, reject) => {
      const handler = (
        window as unknown as {
          PaystackPop?: {
            setup: (opts: Record<string, unknown>) => { openIframe: () => void };
          };
        }
      ).PaystackPop;
      if (!handler) {
        reject(new Error('Payment gateway failed to load.'));
        return;
      }
      const popup = handler.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: session.email,
        amount: session.amountKes * 100,
        currency: 'KES',
        ref: reference,
        metadata: { plan: session.planName },
        callback: (result: { reference: string }) => resolve({ reference: result.reference }),
        onClose: () => reject(new Error('Payment cancelled.')),
      });
      popup.openIframe();
    });
  }

  // --- DEMO MODE: no keys configured; simulate the gateway round-trip ---
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return { reference };
}

function loadPaystackInline(): Promise<void> {
  if (document.getElementById('paystack-inline')) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'paystack-inline';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load payment gateway.'));
    document.body.appendChild(script);
  });
}

export async function confirmSubscription(reference: string) {
  return billingApi.verify(reference);
}
