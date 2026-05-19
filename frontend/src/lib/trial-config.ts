/** Default Pro trial length in days. Override with STRIPE_TRIAL_DAYS env var. */
export const DEFAULT_TRIAL_DAYS = 14;

export function getTrialDays(): number {
  const parsed = parseInt(process.env.STRIPE_TRIAL_DAYS || String(DEFAULT_TRIAL_DAYS), 10);
  return parsed > 0 ? parsed : DEFAULT_TRIAL_DAYS;
}
