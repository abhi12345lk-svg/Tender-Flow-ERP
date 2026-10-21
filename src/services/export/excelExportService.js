import * as XLSX from 'xlsx';
import { downloadBlob } from './wordExportService.js';

/**
 * Format date for Excel cells (YYYY-MM-DD or readable string)
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toISOString().split('T')[0];
  } catch {
    return String(dateStr);
  }
};

/**
 * Generate and trigger download of an XLSX workbook
 */
const downloadWorkbook = (workbook, filename, options = {}) => {
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  if (!options.returnBlobOnly) {
    downloadBlob(blob, filename);
  }
  return { success: true, filename, blob };
};

/**
 * Export Work Orders Register to Excel (.xlsx)
 * Using live IndexedDB data.
 */
export const exportWorkOrdersExcel = (workOrders = [], options = {}) => {
  const fyLabel = options.activeFY ? `FY_${options.activeFY.replace(/[\/\\]/g, '-')}` : 'ALL';
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `Work_Orders_Register_${fyLabel}_${timestamp}.xlsx`;

  const headers = [
    'S.No.',
    'Work Order No.',
    'Tender No.',
    'Work Description / Title',
    'Contractor / Agency',
    'Sanctioned Amount (₹)',
    'WO Date',
    'Financial Year',
    'Subdivision Association',
    'TD (Preserved)',
    'Estimate No.',
    'Time Allowed (Months)',
    'EMD Amount (₹)',
    'SD Amount (₹)',
    'Status',
    'Stipulated Completion Date',
  ];

  let totalWoAmount = 0;
  let totalEmdAmount = 0;
  let totalSdAmount = 0;

  const rows = workOrders.map((wo, idx) => {
    const amount = Number(wo.workOrderAmount) || 0;
    const emd = Number(wo.emdAmount) || 0;
    const sd = Number(wo.sdAmount) || 0;

    totalWoAmount += amount;
    totalEmdAmount += emd;
    totalSdAmount += sd;

    return [
      idx + 1,
      wo.workOrderNumber || '-',
      wo.tenderNumber || '-',
      wo.title || '-',
      wo.contractorName || '-',
      amount,
      formatDate(wo.workOrderDate),
      wo.financialYear || '-',
      wo.subdivisionName || wo.subdivisionId || 'General',
      wo.td || '-',
      wo.estimateNumber || '-',
      Number(wo.timeAllowedMonths) || '-',
      emd,
      sd,
      wo.status || 'Draft',
      formatDate(wo.stipulatedDateOfCompletion),
    ];
  });

  // Summary Row
  const summaryRow = [
    'TOTAL',
    '',
    '',
    `${workOrders.length} Work Orders Recorded`,
    '',
    totalWoAmount,
    '',
    '',
    '',
    '',
    '',
    '',
    totalEmdAmount,
    totalSdAmount,
    '',
    '',
  ];

  const sheetData = [headers, ...rows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Column width calculations
  ws['!cols'] = [
    { wch: 8 },  // S.No
    { wch: 22 }, // Work Order No
    { wch: 20 }, // Tender No
    { wch: 35 }, // Title
    { wch: 25 }, // Contractor
    { wch: 22 }, // Amount
    { wch: 14 }, // WO Date
    { wch: 14 }, // FY
    { wch: 22 }, // Subdivision
    { wch: 16 }, // TD
    { wch: 16 }, // Estimate No
    { wch: 14 }, // Time Allowed
    { wch: 18 }, // EMD
    { wch: 18 }, // SD
    { wch: 14 }, // Status
    { wch: 16 }, // Stipulated Completion
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Work Orders Register');

  return downloadWorkbook(wb, filename, options);
};

/**
 * Export Billing Register to Excel (.xlsx)
 * Computes all statutory deductions, GST amounts, and net payable.
 */
export const exportBillingExcel = (billingList = [], options = {}) => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `Billing_Register_${timestamp}.xlsx`;

  const headers = [
    'S.No.',
    'Invoice No.',
    'Work Order No.',
    'Tender No.',
    'Contractor / Vendor',
    'Subdivision',
    'Invoice Date',
    'Basic Amount (₹)',
    'GST Rate (%)',
    'GST Amount (₹)',
    'Gross Billed (₹)',
    'IT TDS (₹)',
    'GST TDS (₹)',
    'Labour Cess (₹)',
    'SD Retention (₹)',
    'Royalty / Other (₹)',
    'Total Deductions (₹)',
    'Net Payable (₹)',
    'Date of Completion',
    'Date of Handover',
    'Status',
  ];

  let totalBasic = 0;
  let totalGst = 0;
  let totalGross = 0;
  let totalItTds = 0;
  let totalGstTds = 0;
  let totalLabourCess = 0;
  let totalSd = 0;
  let totalRoyalty = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  const rows = billingList.map((bill, idx) => {
    const basic = Number(bill.amount) || 0;
    const gstRate = Number(bill.gstRate) || 18;
    const gstAmount = Number(bill.gstAmount) ?? (basic * gstRate) / 100;
    const gross = Number(bill.totalAmount) || basic + gstAmount;

    const ded = bill.deductions || {};
    const itTds = Number(ded.tdsAmount) || 0;
    const gstTdsVal = Number(ded.gstTds) || 0;
    const labourCessVal = Number(ded.labourCess) || 0;
    const sdVal = Number(ded.sdAmount) || 0;
    const royaltyVal = Number(ded.royalty || ded.penalty || 0);

    const rowTotalDeductions =
      Number(bill.totalDeductions) ?? (itTds + gstTdsVal + labourCessVal + sdVal + royaltyVal);
    const net = Number(bill.netPayable) ?? (gross - rowTotalDeductions);

    totalBasic += basic;
    totalGst += gstAmount;
    totalGross += gross;
    totalItTds += itTds;
    totalGstTds += gstTdsVal;
    totalLabourCess += labourCessVal;
    totalSd += sdVal;
    totalRoyalty += royaltyVal;
    totalDeductions += rowTotalDeductions;
    totalNet += net;

    return [
      idx + 1,
      bill.invoiceNumber || '-',
      bill.workOrderNumber || '-',
      bill.tenderNumber || '-',
      bill.contractorName || '-',
      bill.subdivisionName || bill.subdivisionId || 'General',
      formatDate(bill.invoiceDate),
      basic,
      gstRate,
      gstAmount,
      gross,
      itTds,
      gstTdsVal,
      labourCessVal,
      sdVal,
      royaltyVal,
      rowTotalDeductions,
      net,
      formatDate(bill.dateOfCompletion),
      formatDate(bill.dateOfHandover),
      bill.status || 'Draft',
    ];
  });

  const summaryRow = [
    'TOTAL',
    '',
    '',
    `${billingList.length} Bill Records`,
    '',
    '',
    '',
    totalBasic,
    '',
    totalGst,
    totalGross,
    totalItTds,
    totalGstTds,
    totalLabourCess,
    totalSd,
    totalRoyalty,
    totalDeductions,
    totalNet,
    '',
    '',
    '',
  ];

  const sheetData = [headers, ...rows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 8 },  // S.No
    { wch: 20 }, // Invoice No
    { wch: 22 }, // Work Order No
    { wch: 18 }, // Tender No
    { wch: 25 }, // Contractor
    { wch: 20 }, // Subdivision
    { wch: 14 }, // Date
    { wch: 18 }, // Basic
    { wch: 12 }, // GST %
    { wch: 16 }, // GST Amt
    { wch: 20 }, // Gross
    { wch: 14 }, // IT TDS
    { wch: 14 }, // GST TDS
    { wch: 14 }, // Labour Cess
    { wch: 16 }, // SD
    { wch: 16 }, // Royalty
    { wch: 20 }, // Total Deductions
    { wch: 22 }, // Net Payable
    { wch: 15 }, // Completion
    { wch: 15 }, // Handover
    { wch: 14 }, // Status
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Billing Register');

  return downloadWorkbook(wb, filename, options);
};

/**
 * Export Subdivisions Performance and Work Allocation Register to Excel (.xlsx)
 */
export const exportSubdivisionsExcel = (subdivisions = [], workOrders = [], options = {}) => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `Subdivisions_Register_${timestamp}.xlsx`;

  const headers = [
    'S.No.',
    'Subdivision Code',
    'Subdivision Name',
    'Parent Division',
    'In-Charge Engineer',
    'Contact / Phone',
    'Email Address',
    'Office / Location',
    'Status',
    'Total Work Orders',
    'Total Sanctioned Expenditure (₹)',
  ];

  let totalWorkOrdersCount = 0;
  let totalSanctionedExpenditure = 0;

  const rows = subdivisions.map((sub, idx) => {
    const subId = sub._id || sub.id;
    const subCode = sub.code;
    const subName = sub.name;

    // Match work orders belonging to this subdivision
    const matchedWos = workOrders.filter(
      (wo) =>
        (subId && wo.subdivisionId === subId) ||
        (subCode && wo.subdivisionId === subCode) ||
        (subName && wo.subdivisionName === subName)
    );

    const woCount = matchedWos.length;
    const sanctionedAmount = matchedWos.reduce(
      (acc, wo) => acc + (Number(wo.workOrderAmount) || 0),
      0
    );

    totalWorkOrdersCount += woCount;
    totalSanctionedExpenditure += sanctionedAmount;

    return [
      idx + 1,
      sub.code || '-',
      sub.name || '-',
      sub.divisionName || 'Division No. 1',
      sub.inchargeName || sub.headOfSubdivision || '-',
      sub.contactNumber || sub.phone || '-',
      sub.email || '-',
      sub.location || sub.address || '-',
      sub.status || 'Active',
      woCount,
      sanctionedAmount,
    ];
  });

  const summaryRow = [
    'TOTAL',
    '',
    `${subdivisions.length} Subdivisions`,
    '',
    '',
    '',
    '',
    '',
    '',
    totalWorkOrdersCount,
    totalSanctionedExpenditure,
  ];

  const sheetData = [headers, ...rows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 8 },  // S.No
    { wch: 18 }, // Code
    { wch: 28 }, // Name
    { wch: 22 }, // Division
    { wch: 24 }, // In-Charge
    { wch: 18 }, // Phone
    { wch: 25 }, // Email
    { wch: 25 }, // Location
    { wch: 14 }, // Status
    { wch: 18 }, // WO Count
    { wch: 28 }, // Sanctioned Value
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Subdivisions Register');

  return downloadWorkbook(wb, filename, options);
};

/**
 * Export Financial Years Master Register to Excel (.xlsx)
 */
export const exportFinancialYearsExcel = (financialYears = [], workOrders = [], options = {}) => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `Financial_Years_Register_${timestamp}.xlsx`;

  const headers = [
    'S.No.',
    'Financial Year',
    'Start Date',
    'End Date',
    'Fiscal Status',
    'Active Selection',
    'Work Orders Count',
    'Total Sanctioned Budget Utilized (₹)',
    'Remarks / Gazetted Reference',
  ];

  let totalWos = 0;
  let totalBudget = 0;

  const rows = financialYears.map((fy, idx) => {
    const fyCode = fy.year || fy.financialYear;
    const matchedWos = workOrders.filter((wo) => wo.financialYear === fyCode);
    const woCount = matchedWos.length;
    const budgetUtilized = matchedWos.reduce(
      (acc, wo) => acc + (Number(wo.workOrderAmount) || 0),
      0
    );

    totalWos += woCount;
    totalBudget += budgetUtilized;

    return [
      idx + 1,
      fyCode || '-',
      formatDate(fy.startDate),
      formatDate(fy.endDate),
      fy.status || (fy.isActive ? 'Active' : 'Closed'),
      fy.isActive ? 'CURRENT ACTIVE FY' : 'Historical',
      woCount,
      budgetUtilized,
      fy.remarks || fy.description || '-',
    ];
  });

  const summaryRow = [
    'TOTAL',
    `${financialYears.length} Financial Years`,
    '',
    '',
    '',
    '',
    totalWos,
    totalBudget,
    '',
  ];

  const sheetData = [headers, ...rows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 8 },  // S.No
    { wch: 18 }, // Financial Year
    { wch: 15 }, // Start Date
    { wch: 15 }, // End Date
    { wch: 16 }, // Status
    { wch: 20 }, // Active Selection
    { wch: 18 }, // WO Count
    { wch: 30 }, // Sanctioned Budget
    { wch: 32 }, // Remarks
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Financial Years Register');

  return downloadWorkbook(wb, filename, options);
};

/**
 * Export Agreements Register to Excel (.xlsx)
 */
export const exportAgreementsExcel = (agreements = [], options = {}) => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `Agreements_Register_${timestamp}.xlsx`;

  const headers = [
    'S.No.',
    'Agreement Number',
    'Date of Execution',
    'Work Order Reference',
    'Tender Number',
    'Awarded Contractor / Agency',
    'Template Form Standard',
    'E-Stamp Duty Certificate No.',
    'Stamp Duty Value (₹)',
    'Agreement Status',
  ];

  let totalStampDuty = 0;

  const rows = agreements.map((agr, idx) => {
    const stampVal = Number(agr.stampDutyAmount) || 0;
    totalStampDuty += stampVal;

    return [
      idx + 1,
      agr.agreementNumber || '-',
      formatDate(agr.agreementDate),
      agr.workOrderNumber || '-',
      agr.tenderNumber || '-',
      agr.contractorName || '-',
      agr.templateType || 'Standard Form F-2',
      agr.stampDutyNumber || 'E-STAMP-EXEMPTED',
      stampVal,
      agr.status || 'Active',
    ];
  });

  const summaryRow = [
    'TOTAL',
    '',
    `${agreements.length} Contracts Executed`,
    '',
    '',
    '',
    '',
    '',
    totalStampDuty,
    '',
  ];

  const sheetData = [headers, ...rows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 8 },  // S.No
    { wch: 22 }, // Agreement Number
    { wch: 16 }, // Execution Date
    { wch: 24 }, // Work Order Reference
    { wch: 20 }, // Tender Number
    { wch: 28 }, // Contractor
    { wch: 24 }, // Template Type
    { wch: 26 }, // Stamp Duty No
    { wch: 20 }, // Stamp Duty Amount
    { wch: 16 }, // Status
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Agreements Register');

  return downloadWorkbook(wb, filename, options);
};

/**
 * Export FMD / SD Securities & Custody Register to Excel (.xlsx)
 */
export const exportFmdSdExcel = (fmdList = [], options = {}) => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `FMD_SD_Register_${timestamp}.xlsx`;

  const headers = [
    'S.No.',
    'Tender Number',
    'Related Work Order Ref',
    'Tender Title / Works Description',
    'Contractor / Agency Name',
    'Instrument Type',
    'Pledged Bank Name',
    'Instrument Ref / BG No.',
    'Security Deposit SD (₹)',
    'Earnest Money EMD (₹)',
    'Validity Expiry Date',
    'FMD Custody Status',
    'Verification Status',
  ];

  let totalSd = 0;
  let totalEmd = 0;

  const rows = fmdList.map((fmd, idx) => {
    const sd = Number(fmd.sdAmount) || 0;
    const emd = Number(fmd.emdAmount) || 0;

    totalSd += sd;
    totalEmd += emd;

    return [
      idx + 1,
      fmd.tenderNumber || '-',
      fmd.workOrderNumber || 'Direct Tender',
      fmd.tenderTitle || '-',
      fmd.contractorName || '-',
      fmd.instrumentType || 'Bank Guarantee / FDR',
      fmd.bankName || 'Scheduled Bank',
      fmd.instrumentReference || '-',
      sd,
      emd,
      formatDate(fmd.validityDate),
      fmd.fmdStatus || 'Deposited',
      fmd.verificationStatus || 'Verified & Pledged',
    ];
  });

  const summaryRow = [
    'TOTAL',
    '',
    '',
    `${fmdList.length} Security Deposits Held`,
    '',
    '',
    '',
    '',
    totalSd,
    totalEmd,
    '',
    '',
    '',
  ];

  const sheetData = [headers, ...rows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 8 },  // S.No
    { wch: 20 }, // Tender No
    { wch: 24 }, // Work Order Ref
    { wch: 32 }, // Title
    { wch: 28 }, // Contractor
    { wch: 22 }, // Instrument Type
    { wch: 22 }, // Bank Name
    { wch: 22 }, // Instrument Ref
    { wch: 22 }, // SD Amount
    { wch: 22 }, // EMD Amount
    { wch: 16 }, // Validity
    { wch: 18 }, // Custody Status
    { wch: 24 }, // Verification Status
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'FMD & SD Register');

  return downloadWorkbook(wb, filename, options);
};
