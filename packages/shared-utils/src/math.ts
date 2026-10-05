/**
 * Calculates the tax amount for a given base amount and tax rate.
 * @param amount - The base amount
 * @param rate - The tax rate percentage (e.g., 18 for 18%)
 * @returns The calculated tax amount
 */
export const calculateTax = (amount: number, rate: number): number => {
  return (amount * rate) / 100;
};

/**
 * Extracts tax rate from tax class name string (e.g. "GST 28%" -> 28).
 * @param taxClassName - The tax class name string from DB
 * @param defaultRate - Fallback rate if not found
 * @returns The parsed tax rate
 */
export const getTaxRateFromClass = (taxClassName?: string, defaultRate: number = 18): number => {
  if (!taxClassName) return defaultRate;
  const match = taxClassName.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return defaultRate;
};
