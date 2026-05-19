/** True when the value is a real Stripe customer id (cus_…). */
export function isRealStripeCustomerId(id: string | null | undefined): boolean {
  return !!id && id.startsWith("cus_");
}

/** Placeholder ids written before checkout (explore_…). */
export function isPlaceholderStripeCustomerId(id: string | null | undefined): boolean {
  return !!id && (id.startsWith("explore_") || !isRealStripeCustomerId(id));
}
