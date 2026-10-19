/**
 * Formats a number as Indian Currency (₹)
 * Example: 1250000 -> ₹ 12,50,000.00
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹ 0.00';
  }
  const numeric = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
};

/**
 * Format date string to display format (DD/MM/YYYY)
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Calculate GST and Total
 * defaultRate is percentage (e.g. 18 for 18%)
 */
export const calculateGST = (amount, rate = 18) => {
  const base = parseFloat(amount) || 0;
  const gstRate = parseFloat(rate) || 0;
  const gstAmount = (base * gstRate) / 100;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const total = base + gstAmount;

  return {
    baseAmount: base,
    gstRate,
    gstAmount,
    cgst,
    sgst,
    totalAmount: total,
  };
};

/**
 * Calculate Net Billing after Deductions
 */
export const calculateNetBilling = (totalAmount, deductions = {}) => {
  const total = parseFloat(totalAmount) || 0;
  const sd = parseFloat(deductions.sdAmount) || 0;
  const tds = parseFloat(deductions.tdsAmount) || 0;
  const labourCess = parseFloat(deductions.labourCess) || 0;
  const royalty = parseFloat(deductions.royalty) || 0;
  const penalty = parseFloat(deductions.penalty) || 0;

  const totalDeductions = sd + tds + labourCess + royalty + penalty;
  const netPayable = Math.max(0, total - totalDeductions);

  return {
    totalAmount: total,
    totalDeductions,
    netPayable,
  };
};

/**
 * Generate unique local ID
 */
export const generateId = (prefix = 'REC') => {
  return `${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
};
