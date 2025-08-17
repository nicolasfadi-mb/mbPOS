import type { LbpDenomination, UsdDenomination } from './types';

export const TAX_RATE = 0.11; // 11% VAT
export const INITIAL_DELETION_PIN = '0000'; // Default PIN for deletions

// Material Design-inspired colors
export const CATEGORY_COLORS: Record<string, { bg: string, text: string, hoverBg: string, border: string }> = {
  Coffee:   { bg: 'bg-primary-container',   text: 'text-on-primary-container',   hoverBg: 'hover:bg-primary-container/80', border: 'border-primary-container' },
  Pastries: { bg: 'bg-tertiary-container',  text: 'text-on-tertiary-container',  hoverBg: 'hover:bg-tertiary-container/80', border: 'border-tertiary-container' },
  Tea:      { bg: 'bg-secondary-container', text: 'text-on-secondary-container', hoverBg: 'hover:bg-secondary-container/80', border: 'border-secondary-container' },
  Drinks:   { bg: 'bg-error-container',     text: 'text-on-error-container',     hoverBg: 'hover:bg-error-container/80', border: 'border-error-container' },
  Default:  { bg: 'bg-surface-container-high', text: 'text-on-surface-variant',   hoverBg: 'hover:bg-surface-container-highest', border: 'border-outline/20' },
};

export const LBP_DENOMINATIONS: LbpDenomination[] = [100000, 50000, 20000, 10000, 5000, 1000];
export const USD_DENOMINATIONS: UsdDenomination[] = [100, 50, 20, 10, 5, 1];

export const formatPrice = (priceLBP: number, usdToLbpRate: number): { usd: string, lbp: string } => {
  const priceUSD = priceLBP / usdToLbpRate;
  return {
    usd: `$${priceUSD.toFixed(2)}`,
    lbp: `${Math.round(priceLBP).toLocaleString()} LBP`,
  };
};

export const INITIAL_CASH_BOX_INCOME_CATEGORIES: string[] = [
    'Owner Deposit',
    'Miscellaneous Income',
];

export const INITIAL_CASH_BOX_EXPENSE_CATEGORIES: string[] = [
    'Supplier Payment',
    'Utilities Bill',
    'Rent Payment',
    'Salary Payout',
    'Office Supplies',
    'Maintenance & Repairs',
    'Petty Cash Expense',
];