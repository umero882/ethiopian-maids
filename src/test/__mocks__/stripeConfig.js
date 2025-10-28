export const STRIPE_CONFIG = {
  publishableKey: 'pk_test_mock',
  apiVersion: '2023-10-16',
};

export function validateStripeConfig() {
  return { isValid: true, errors: [], warnings: [] };
}

export default STRIPE_CONFIG;

