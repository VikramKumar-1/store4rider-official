/**
 * Shipping Utility Functions
 */

/**
 * Calculates volumetric weight based on standard courier formula (L x B x H / 5000)
 * Dimensions should be in centimeters (cm).
 * Returns weight in kilograms (kg).
 */
export function calculateVolumetricWeight(lengthCm: number, breadthCm: number, heightCm: number): number {
  if (lengthCm <= 0 || breadthCm <= 0 || heightCm <= 0) return 0;
  return (lengthCm * breadthCm * heightCm) / 5000;
}

/**
 * Calculates the chargeable weight.
 * Couriers charge based on the higher of actual weight and volumetric weight.
 */
export function calculateChargeableWeight(actualWeightKg: number, volumetricWeightKg: number): number {
  return Math.max(actualWeightKg, volumetricWeightKg);
}
