/**
 * TenderFlow ERP — Centralized Billing & Statutory Deductions Configuration
 *
 * Centralizes all statutory tax rates, calculation bases, and deduction rules.
 * Does not hardcode tax rates across UI components.
 * Default rates represent standard departmental assumptions and can be overridden.
 */

export const DEFAULT_BILLING_RATES = {
  // GST on Works Contracts
  gst: {
    code: 'gst',
    label: 'Goods & Services Tax (GST)',
    defaultRate: 18, // 18% standard assumption for government works
    calculationBase: 'baseAmount', // applied on basic bill value
    description: 'Statutory GST (CGST 9% + SGST 9% or IGST 18%)',
    isStatutory: true,
  },

  // Security Deposit (SD Retention from Running Bills)
  sd: {
    code: 'sd',
    label: 'Security Deposit (SD Retention)',
    defaultRate: 5, // 5% standard deduction rule (deducted until contractual limit)
    calculationBase: 'baseAmount',
    description: 'Contractual SD retention deducted from running account bills',
    isStatutory: true,
  },

  // TDS under Section 194C of Income Tax Act
  itTds: {
    code: 'itTds',
    label: 'TDS (Income Tax)',
    defaultRate: 2, // 2% for companies/firms (1% for individuals/HUF)
    calculationBase: 'baseAmount',
    description: 'Income Tax TDS on contractor payments under Section 194C',
    isStatutory: true,
  },

  // GST TDS under Section 51 of CGST Act
  gstTds: {
    code: 'gstTds',
    label: 'GST TDS (CGST + SGST)',
    defaultRate: 0, // Default 0% on standard running bills; 2% when Section 51 is applicable/notified
    standardRate: 2, // 2% (1% CGST + 1% SGST)
    calculationBase: 'baseAmount',
    thresholdAmount: 250000, // Applicable on contract value > ₹2.5 Lakhs
    description: 'Deduction of tax at source by government departments under Section 51',
    isStatutory: true,
  },

  // Labour Welfare Cess under BOCW Act 1996
  labourCess: {
    code: 'labourCess',
    label: 'Labour Welfare Cess (BOCW)',
    defaultRate: 1, // 1% mandatory statutory cess
    calculationBase: 'baseAmount',
    description: '1% mandatory cess under Building and Other Construction Workers Welfare Cess Act',
    isStatutory: true,
  },

  // Mining / Mineral Royalty
  royalty: {
    code: 'royalty',
    label: 'Mineral Royalty',
    defaultRate: 0, // Flat rate or per-item, manual entry by default
    calculationBase: 'manual',
    description: 'Seigniorage fee / royalty on sand, soil, and aggregate minerals',
    isStatutory: true,
  },

  // Liquidated Damages / Contractual Penalty
  penalty: {
    code: 'penalty',
    label: 'Penalty / Liquidated Damages',
    defaultRate: 0, // Contractual penalty
    calculationBase: 'manual',
    description: 'Withheld amount or penalty for delay/non-compliance',
    isStatutory: false,
  },
};

/**
 * Safely parse a positive numeric value, defaulting to fallback
 */
export const safeNumber = (val, fallback = 0) => {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  return isNaN(num) ? fallback : Math.max(0, num);
};

/**
 * Round a currency value to 2 decimal places
 */
export const roundToTwo = (val) => {
  const num = Number(val);
  if (isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Comprehensive Billing Calculation Engine
 *
 * @param {number|string} basicAmount - Basic contract work amount (pre-tax)
 * @param {number|string} gstRate - Configurable GST rate percentage (default: 18%)
 * @param {object} rawDeductions - User-supplied or existing deduction amounts/overrides
 * @param {object} customConfig - Optional customized rate overrides
 * @returns {object} Full calculation breakdown with rates, bases, amounts, and override flags
 */
export const calculateBillingBreakdown = (
  basicAmount,
  gstRate = DEFAULT_BILLING_RATES.gst.defaultRate,
  rawDeductions = {},
  customConfig = {}
) => {
  const base = safeNumber(basicAmount, 0);
  const numRate = Number(gstRate);
  const isInvalidRate = gstRate === '' || gstRate === null || gstRate === undefined || isNaN(numRate);
  const effectiveGstRate = isInvalidRate
    ? DEFAULT_BILLING_RATES.gst.defaultRate
    : Math.max(0, numRate);

  // 1. GST Calculation
  const gstAmount = roundToTwo((base * effectiveGstRate) / 100);
  const cgst = roundToTwo(gstAmount / 2);
  const sgst = roundToTwo(gstAmount / 2);
  const totalGrossAmount = roundToTwo(base + gstAmount);

  // 2. Compute individual deductions with rate, calculation base, and override tracking
  const config = { ...DEFAULT_BILLING_RATES, ...customConfig };

  const computeItem = (fieldKey, dedConfig) => {
    const rawVal = rawDeductions[fieldKey];
    const isExempt = Boolean(rawDeductions[`${fieldKey}Exempt`]);

    if (isExempt) {
      return {
        key: fieldKey,
        label: dedConfig.label,
        rate: dedConfig.defaultRate,
        calculationBase: dedConfig.calculationBase,
        baseValue: base,
        computedAmount: 0,
        amount: 0,
        isOverridden: false,
        isExempt: true,
      };
    }

    // Auto-computed amount based on base value
    let computed = 0;
    if (dedConfig.calculationBase === 'baseAmount' && dedConfig.defaultRate > 0) {
      computed = roundToTwo((base * dedConfig.defaultRate) / 100);
    }

    // Check if user has explicitly provided/overridden the value
    const hasExplicitValue = rawVal !== undefined && rawVal !== null && rawVal !== '';
    const actualAmount = hasExplicitValue ? roundToTwo(safeNumber(rawVal)) : computed;
    const isOverridden = hasExplicitValue && actualAmount !== computed;

    return {
      key: fieldKey,
      label: dedConfig.label,
      rate: dedConfig.defaultRate,
      calculationBase: dedConfig.calculationBase,
      baseValue: base,
      computedAmount: computed,
      amount: actualAmount,
      isOverridden,
      isExempt: false,
    };
  };

  const sdItem = computeItem('sdAmount', config.sd);
  const itTdsItem = computeItem('tdsAmount', config.itTds);
  const labourCessItem = computeItem('labourCess', config.labourCess);
  const royaltyItem = computeItem('royalty', config.royalty);
  const penaltyItem = computeItem('penalty', config.penalty);

  // Optional GST TDS
  const gstTdsItem = computeItem('gstTdsAmount', config.gstTds);

  // 3. Total Deductions
  const totalDeductions = roundToTwo(
    sdItem.amount +
    itTdsItem.amount +
    labourCessItem.amount +
    royaltyItem.amount +
    penaltyItem.amount +
    gstTdsItem.amount
  );

  // 4. Net Disbursable Amount
  const netPayable = roundToTwo(Math.max(0, totalGrossAmount - totalDeductions));

  return {
    baseAmount: base,
    gstRate: effectiveGstRate,
    gstAmount,
    cgst,
    sgst,
    totalAmount: totalGrossAmount,
    deductions: {
      sdAmount: sdItem.amount,
      tdsAmount: itTdsItem.amount,
      labourCess: labourCessItem.amount,
      royalty: royaltyItem.amount,
      penalty: penaltyItem.amount,
      gstTdsAmount: gstTdsItem.amount,
    },
    deductionBreakdown: {
      sd: sdItem,
      itTds: itTdsItem,
      labourCess: labourCessItem,
      royalty: royaltyItem,
      penalty: penaltyItem,
      gstTds: gstTdsItem,
    },
    totalDeductions,
    netPayable,
  };
};
