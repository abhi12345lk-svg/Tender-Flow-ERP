/**
 * TenderFlow ERP — FMD / SD Instrument Expiry Warning Service
 *
 * Provides safe, non-destructive tracking of validity expiry for Bank Guarantees,
 * Fixed Deposit Receipts (FDR), and Security Deposits.
 *
 * SAFETY RULE: Expiry status calculations are strictly advisory warnings.
 * The system MUST NOT automatically release, renew, or forfeit any instrument upon expiry.
 */

export const DEFAULT_EXPIRY_WARNING_DAYS = 30;

/**
 * Normalizes date to midnight UTC/Local for precise day comparison
 */
export const normalizeToMidnight = (dateInput) => {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Calculate instrument expiry status and days remaining
 *
 * @param {string|Date} validityDate - Stored validity date (e.g. '2026-03-31')
 * @param {number} warningDays - Warning threshold in days (default: 30)
 * @param {Date} referenceDate - Reference date for comparison (default: current date)
 * @returns {object} Status object with daysRemaining, status, badgeVariant, and label
 */
export const calculateInstrumentExpiry = (
  validityDate,
  warningDays = DEFAULT_EXPIRY_WARNING_DAYS,
  referenceDate = new Date()
) => {
  const targetDate = normalizeToMidnight(validityDate);
  if (!targetDate) {
    return {
      status: 'no_date',
      daysRemaining: null,
      label: 'No Expiry Date Set',
      badgeVariant: 'secondary',
      isUrgent: false,
      isExpired: false,
      isExpiringSoon: false,
    };
  }

  const today = normalizeToMidnight(referenceDate);
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      status: 'expired',
      daysRemaining: diffDays,
      overdueDays,
      label: overdueDays === 1 ? 'Expired 1 day ago' : `Expired ${overdueDays} days ago`,
      shortLabel: `Expired (${overdueDays}d)`,
      badgeVariant: 'danger',
      isUrgent: true,
      isExpired: true,
      isExpiringSoon: false,
    };
  }

  if (diffDays <= warningDays) {
    return {
      status: 'expiring_soon',
      daysRemaining: diffDays,
      warningWindowDays: warningDays,
      label: diffDays === 0 ? 'Expires Today' : diffDays === 1 ? 'Expires Tomorrow' : `Expires in ${diffDays} days`,
      shortLabel: diffDays === 0 ? 'Expires Today' : `Expiring (${diffDays}d)`,
      badgeVariant: 'warning',
      isUrgent: true,
      isExpired: false,
      isExpiringSoon: true,
    };
  }

  return {
    status: 'active',
    daysRemaining: diffDays,
    label: `Active (${diffDays} days validity remaining)`,
    shortLabel: `Valid (${diffDays}d)`,
    badgeVariant: 'success',
    isUrgent: false,
    isExpired: false,
    isExpiringSoon: false,
  };
};

/**
 * Summarize instruments across an entire FMD list
 *
 * @param {Array} fmdList - List of FMD / SD records
 * @param {number} warningDays - Configurable warning window
 * @returns {object} Aggregated counts and lists of urgent instruments
 */
export const summarizeFmdExpiries = (fmdList = [], warningDays = DEFAULT_EXPIRY_WARNING_DAYS) => {
  let activeCount = 0;
  let expiringSoonCount = 0;
  let expiredCount = 0;
  let noDateCount = 0;
  const urgentItems = [];

  fmdList.forEach((item) => {
    // Only check active custody instruments (ignore already released or forfeited items)
    const isReleasedOrForfeited = item.fmdStatus === 'Released' || item.fmdStatus === 'Forfeited';
    const expiry = calculateInstrumentExpiry(item.validityDate, warningDays);

    if (isReleasedOrForfeited) {
      // Historical instrument
      return;
    }

    if (expiry.status === 'expired') {
      expiredCount++;
      urgentItems.push({ item, expiry });
    } else if (expiry.status === 'expiring_soon') {
      expiringSoonCount++;
      urgentItems.push({ item, expiry });
    } else if (expiry.status === 'active') {
      activeCount++;
    } else {
      noDateCount++;
    }
  });

  return {
    totalCustody: fmdList.length,
    activeCount,
    expiringSoonCount,
    expiredCount,
    noDateCount,
    urgentCount: expiredCount + expiringSoonCount,
    urgentItems,
  };
};
