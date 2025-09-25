// Currency utility for Egyptian Pound formatting
export const formatPrice = (price: number): string => {
  return `${price.toFixed(2)} EGP`;
};

export const formatCurrency = (amount: number, currency: string = 'EGP'): string => {
  return `${amount.toFixed(2)} ${currency}`;
};

export const parseCurrency = (currencyString: string): number => {
  return parseFloat(currencyString.replace(/[^\d.-]/g, ''));
};