const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatCurrency = (amount: number): string => {
  return currencyFormatter.format(amount);
};

export const parseCurrency = (value: string): number => {
  const cleanValue = value.replace(/[^\d]/g, '');
  return parseInt(cleanValue, 10) || 0;
};

export const formatCompact = (amount: number): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)} M`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)} Jt`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)} Rb`;
  }
  return formatCurrency(amount);
};

export const calculateChange = (paid: number, total: number): number => {
  return Math.max(0, paid - total);
};

export default {
  formatCurrency,
  parseCurrency,
  formatCompact,
  calculateChange,
}; 