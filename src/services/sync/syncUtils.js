/**
 * TenderFlow ERP — Safe Cloud Sync Utilities
 * Pure diffing, field comparison, and schema normalization across all 6 business modules.
 */

export const MODULE_CONFIG = {
  financialYears: {
    label: 'Financial Years',
    keyField: 'label',
    apiRef: 'financialYears',
    repoRef: 'financialYears',
    compareFields: ['label', 'status', 'isCurrent', 'startDate', 'endDate', 'description'],
  },
  subdivisions: {
    label: 'Subdivisions',
    keyField: 'code',
    apiRef: 'subdivisions',
    repoRef: 'subdivisions',
    compareFields: ['code', 'name', 'inCharge', 'location', 'status'],
  },
  workOrders: {
    label: 'Work Orders',
    keyField: 'workOrderNumber',
    apiRef: 'workOrders',
    repoRef: 'workOrders',
    compareFields: [
      'workOrderNumber',
      'tenderNumber',
      'title',
      'contractorName',
      'workOrderAmount',
      'status',
      'td',
      'emdNumber',
      'estimateNumber',
      'financialYear',
      'stipulatedDateOfCompletion',
    ],
  },
  agreements: {
    label: 'Agreements',
    keyField: 'agreementNumber',
    apiRef: 'agreements',
    repoRef: 'agreements',
    compareFields: [
      'agreementNumber',
      'tenderNumber',
      'contractorName',
      'templateType',
      'agreementDate',
      'stampDutyNumber',
      'stampDutyAmount',
      'status',
      'language',
    ],
  },
  billing: {
    label: 'Billing Records',
    keyField: 'invoiceNumber',
    apiRef: 'billing',
    repoRef: 'billing',
    compareFields: [
      'invoiceNumber',
      'invoiceDate',
      'contractorName',
      'amount',
      'gstRate',
      'gstAmount',
      'totalAmount',
      'status',
      'totalDeductions',
      'netPayable',
    ],
  },
  fmdSd: {
    label: 'FMD / SD Custody',
    keyField: 'tenderNumber',
    apiRef: 'fmdSd',
    repoRef: 'fmdSd',
    compareFields: [
      'tenderNumber',
      'contractorName',
      'fmdStatus',
      'sdAmount',
      'emdAmount',
      'instrumentType',
      'bankName',
      'instrumentReference',
      'validityDate',
    ],
  },
};

// Normalize a MongoDB document for clean comparison against Dexie records
export const normalizeRemoteDoc = (doc) => {
  if (!doc) return doc;
  return {
    ...doc,
    _id: doc._id ? doc._id.toString() : undefined,
    id: doc.id || (doc._id ? doc._id.toString() : undefined),
    startDate: doc.startDate ? doc.startDate.split('T')[0] : doc.startDate,
    endDate: doc.endDate ? doc.endDate.split('T')[0] : doc.endDate,
    workOrderDate: doc.workOrderDate ? doc.workOrderDate.split('T')[0] : doc.workOrderDate,
    invoiceDate: doc.invoiceDate ? doc.invoiceDate.split('T')[0] : doc.invoiceDate,
    agreementDate: doc.agreementDate ? doc.agreementDate.split('T')[0] : doc.agreementDate,
    validityDate: doc.validityDate ? doc.validityDate.split('T')[0] : doc.validityDate,
    stipulatedDateOfCompletion: doc.stipulatedDateOfCompletion
      ? doc.stipulatedDateOfCompletion.split('T')[0]
      : doc.stipulatedDateOfCompletion,
  };
};

// Normalize a local Dexie record
export const normalizeLocalDoc = (doc) => {
  if (!doc) return doc;
  return {
    ...doc,
    id: doc.id || doc._id,
  };
};

/**
 * Compare two records field-by-field and return list of differing attributes
 */
export const computeFieldDiffs = (localItem, remoteItem, compareFields) => {
  const diffs = [];
  for (const field of compareFields) {
    const localVal = localItem[field];
    const remoteVal = remoteItem[field];

    // Normalize for comparisons (numbers vs strings, undefined vs null)
    const normalizedLocal = localVal === undefined || localVal === null ? '' : String(localVal).trim();
    const normalizedRemote = remoteVal === undefined || remoteVal === null ? '' : String(remoteVal).trim();

    if (normalizedLocal !== normalizedRemote) {
      diffs.push({
        field,
        localValue: localVal,
        cloudValue: remoteVal,
      });
    }
  }
  return diffs;
};
