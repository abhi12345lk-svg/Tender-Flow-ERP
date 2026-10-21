/**
 * TenderFlow ERP — Security Deposit (SD) Release Clearance Gate
 *
 * Enforces safe, auditable commercial release procedures. Records release order
 * references and defect liability period (DLP) settlements.
 */

export const DEFAULT_SD_RELEASE_CONFIG = {
  // Required fields before an instrument can be transitioned to "Released"
  requiredFields: [
    {
      key: 'releaseOrderNumber',
      label: 'Release Order / Sanction Reference Number',
      type: 'text',
      placeholder: 'e.g. RO-DIV1-2026-042',
      description: 'Reference number of release sanction / settlement order',
    },
    {
      key: 'releaseApprovalDate',
      label: 'Competent Authority Approval Date',
      type: 'date',
      description: 'Date formal release sanction was signed',
    },
    {
      key: 'releaseApprovingAuthority',
      label: 'Approving Authority / Officer',
      type: 'text',
      placeholder: 'e.g. Operations Director / Project Manager',
      description: 'Designation of officer authorizing custody release',
    },
    {
      key: 'dlpClearanceStatus',
      label: 'Defect Liability Period (DLP) Verification',
      type: 'boolean',
      description: 'Confirmation that warranty / maintenance period has completed satisfactorily',
    },
  ],

  // Optional checklist verifications
  optionalChecklist: [
    {
      key: 'finalBillPassed',
      label: 'Final Bill Passed & Reconciled',
      type: 'boolean',
      description: 'Final bill has been passed and all accounts reconciled',
    },
    {
      key: 'noDuesCertificate',
      label: 'No Dues / No Demand Certificate Obtained',
      type: 'boolean',
      description: 'Agency has submitted signed No Claim / No Dues undertaking',
    },
  ],

  disclaimer:
    'Release Documentation: Record the release reference and DLP clearance details for audit.',
};

/**
 * Validates whether an FMD / SD record qualifies for the "Released" status
 *
 * @param {object} record - FMD / SD form data or database record
 * @param {object} config - Configurable clearance gate checklist
 * @returns {object} { allowed: boolean, errors: object, missingFields: string[] }
 */
export const validateSdReleaseGate = (record, config = DEFAULT_SD_RELEASE_CONFIG) => {
  // Only evaluate clearance requirements when status is "Released"
  if (record.fmdStatus !== 'Released') {
    return {
      allowed: true,
      errors: {},
      missingFields: [],
    };
  }

  const errors = {};
  const missingFields = [];

  // 1. Release Order Reference Number
  if (!record.releaseOrderNumber || !String(record.releaseOrderNumber).trim()) {
    errors.releaseOrderNumber = 'Clearance Gate: Release Order / Sanction Reference is required';
    missingFields.push('releaseOrderNumber');
  }

  // 2. Approval Date
  if (!record.releaseApprovalDate) {
    errors.releaseApprovalDate = 'Clearance Gate: Formal Approval Date is required';
    missingFields.push('releaseApprovalDate');
  }

  // 3. Approving Authority
  if (!record.releaseApprovingAuthority || !String(record.releaseApprovingAuthority).trim()) {
    errors.releaseApprovingAuthority = 'Clearance Gate: Approving Authority designation is required';
    missingFields.push('releaseApprovingAuthority');
  }

  // 4. Defect Liability Period Clearance Confirmation
  if (record.dlpClearanceStatus !== true && record.dlpClearanceStatus !== 'true') {
    errors.dlpClearanceStatus = 'Clearance Gate: Defect Liability Period (DLP) clearance must be certified';
    missingFields.push('dlpClearanceStatus');
  }

  return {
    allowed: Object.keys(errors).length === 0,
    errors,
    missingFields,
    requiresClearance: true,
  };
};
