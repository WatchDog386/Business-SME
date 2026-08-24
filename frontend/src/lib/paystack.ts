/**
 * Paystack checkout bridge.
 *
 * Plug your Paystack integration in here — e.g. load the Paystack Inline JS
 * (https://js.paystack.co/v1/inline.js) with your PUBLIC key, call
 * PaystackPop.setup({ key, email, amount: amountKes * 100, ... }).openIframe()
 * inside startCheckout(), and resolve the promise from the `callback`
 * response. The rest of the app only depends on this contract:
 * it resolves with a reference when payment succeeds and rejects on failure/cancel.
 */

export interface CheckoutSession {
  email: string;
  planId: string;
  planName: string;
  /** Amount in whole shillings */
  amountKes: number;
}

export interface CheckoutResult {
  reference: string;
}

export async function startCheckout(_session: CheckoutSession): Promise<CheckoutResult> {
  // --- DEMO MODE: replace the block below with your Paystack call ---
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return { reference: `PS-${Date.now().toString(36).toUpperCase()}` };
}
