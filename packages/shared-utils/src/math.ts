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
  const match = taxClassName.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const parsed = parseFloat(match[1]);
    return isNaN(parsed) ? defaultRate : parsed;
  }
  return defaultRate;
};

/**
 * Calculates taxable amount and tax amount when price is GST-inclusive.
 * Example: ₹1180 with 18% GST -> taxableAmount: ₹1000, taxAmount: ₹180.
 *
 * @param totalAmount - The gross inclusive amount
 * @param rate - The tax rate percentage (e.g. 18 for 18%)
 * @returns Object with taxableAmount and taxAmount
 */
export const calculateInclusiveTax = (totalAmount: number, rate: number): { taxableAmount: number; taxAmount: number } => {
  if (rate <= 0 || totalAmount <= 0) {
    return { taxableAmount: totalAmount, taxAmount: 0 };
  }
  const taxableAmount = Math.round((totalAmount / (1 + rate / 100)) * 100) / 100;
  const taxAmount = Math.round((totalAmount - taxableAmount) * 100) / 100;
  return { taxableAmount, taxAmount };
};
