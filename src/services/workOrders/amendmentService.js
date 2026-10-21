/**
 * TenderFlow ERP — Work Order Amendment History & Baseline Preservation Service
 *
 * Implements strict government contracting safeguards:
 * 1. Preserves original sanctioned baseline amount and stipulated completion date forever.
 * 2. Records all proposed revisions, reasons, reference dispatches, and dates in an immutable history.
 * 3. Keeps amendment workflow strictly in "Pending Departmental Approval" state.
 * 4. NEVER silently overwrites historical baseline values.
 */

/**
 * Resolve preserved baseline values for a Work Order
 */
export const getWorkOrderBaseline = (workOrder) => {
  if (!workOrder) {
    return {
      originalSanctionedAmount: 0,
      originalStipulatedCompletionDate: '',
    };
  }

  return {
    originalSanctionedAmount:
      workOrder.originalSanctionedAmount !== undefined && workOrder.originalSanctionedAmount !== null
        ? Number(workOrder.originalSanctionedAmount)
        : Number(workOrder.workOrderAmount || 0),
    originalStipulatedCompletionDate:
      workOrder.originalStipulatedCompletionDate || workOrder.stipulatedDateOfCompletion || '',
  };
};

/**
 * Validates a proposed amendment input
 */
export const validateAmendmentInput = (input) => {
  const errors = {};
  if (!input.referenceNumber || !String(input.referenceNumber).trim()) {
    errors.referenceNumber = 'Official reference or proposal dispatch number is required';
  }
  if (!input.amendmentDate) {
    errors.amendmentDate = 'Amendment submission date is required';
  }
  if (!input.reason || !String(input.reason).trim()) {
    errors.reason = 'Justification / Reason for scope or time amendment is required';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Create a proposed amendment record attached to the Work Order without
 * overwriting original sanctioned baseline values.
 *
 * @param {object} workOrder - Current Work Order
 * @param {object} amendmentInput - Proposed values and justifications
 * @returns {object} Updated Work Order object with amendment appended and baseline preserved
 */
export const createProposedAmendment = (workOrder, amendmentInput) => {
  const baseline = getWorkOrderBaseline(workOrder);
  const existingAmendments = Array.isArray(workOrder.amendments) ? workOrder.amendments : [];
  const seq = existingAmendments.length + 1;

  const currentAmt = Number(workOrder.workOrderAmount || 0);
  const proposedAmt =
    amendmentInput.proposedAmount !== undefined && amendmentInput.proposedAmount !== ''
      ? Number(amendmentInput.proposedAmount)
      : currentAmt;

  const amountVariation = proposedAmt - currentAmt;

  const newAmendment = {
    id: `AMD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    amendmentNumber: amendmentInput.amendmentNumber || `AMD-0${seq}`,
    referenceNumber: String(amendmentInput.referenceNumber || '').trim(),
    amendmentDate: amendmentInput.amendmentDate || new Date().toISOString().split('T')[0],
    reason: String(amendmentInput.reason || '').trim(),
    proposedAmount: proposedAmt,
    amountVariation,
    proposedCompletionDate: amendmentInput.proposedCompletionDate || workOrder.stipulatedDateOfCompletion || '',
    timeExtensionDays: Number(amendmentInput.timeExtensionDays) || 0,
    status: 'Pending Departmental Approval',
    approvalStatusText: 'Pending Competent Authority (SE / CE) Confirmation',
    submittedBy: String(amendmentInput.submittedBy || 'Assistant Engineer / Executive Engineer').trim(),
    remarks: String(amendmentInput.remarks || '').trim(),
    createdAt: new Date().toISOString(),
  };

  return {
    ...workOrder,
    // Preserve baseline values
    originalSanctionedAmount: baseline.originalSanctionedAmount,
    originalStipulatedCompletionDate: baseline.originalStipulatedCompletionDate,
    // Baseline is preserved; existing workOrderAmount is NOT silently overwritten
    amendments: [...existingAmendments, newAmendment],
  };
};
