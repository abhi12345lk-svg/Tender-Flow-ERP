/**
 * TenderFlow ERP — Phase 2 Automated Feature Verification Suite
 *
 * Targeted verification for:
 * 1. Billing Configuration & Statutory Deductions
 * 2. FMD / SD Expiry Warnings
 * 3. SD Release Clearance Gate
 * 4. Work Order Amendments & Baseline Preservation
 * 5. Divisional Audit Trail & Sensitive Data Sanitization
 */

import {
  calculateBillingBreakdown,
  DEFAULT_BILLING_RATES,
  roundToTwo,
  safeNumber,
} from '../src/services/billing/billingCalculationConfig.js';

import {
  calculateInstrumentExpiry,
  summarizeFmdExpiries,
  DEFAULT_EXPIRY_WARNING_DAYS,
  normalizeToMidnight,
} from '../src/services/fmd/fmdExpiryService.js';

import {
  validateSdReleaseGate,
  DEFAULT_SD_RELEASE_CONFIG,
} from '../src/services/fmd/sdReleaseGate.js';

import {
  getWorkOrderBaseline,
  createProposedAmendment,
  validateAmendmentInput,
} from '../src/services/workOrders/amendmentService.js';

import {
  sanitizeAuditData,
  computeChangedFieldsSummary,
  auditService,
} from '../src/services/audit/auditService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n=============================================================');
console.log('TenderFlow ERP — Phase 2 Automated Verification Suite');
console.log('=============================================================\n');

// --------------------------------------------------------------------------
// SUITE 1: Billing Configuration & Statutory Deductions Engine
// --------------------------------------------------------------------------
console.log('--- Suite 1: Billing Configuration & Statutory Deductions ---');

// 1.1 Centralized rate definitions
assert(
  DEFAULT_BILLING_RATES.gst.defaultRate === 18 && DEFAULT_BILLING_RATES.gst.calculationBase === 'baseAmount',
  'GST default rate is 18% on basic bill amount'
);
assert(
  DEFAULT_BILLING_RATES.sd.defaultRate === 5 && DEFAULT_BILLING_RATES.sd.calculationBase === 'baseAmount',
  'SD default retention rate is 5% on basic bill amount'
);
assert(
  DEFAULT_BILLING_RATES.itTds.defaultRate === 2 && DEFAULT_BILLING_RATES.itTds.calculationBase === 'baseAmount',
  'Income Tax TDS default rate is 2% on basic bill amount'
);
assert(
  DEFAULT_BILLING_RATES.labourCess.defaultRate === 1 && DEFAULT_BILLING_RATES.labourCess.calculationBase === 'baseAmount',
  'Labour Cess default rate is 1% on basic bill amount'
);

// 1.2 Standard calculation breakdown
const basic = 100000; // ₹1,00,000
const breakdown1 = calculateBillingBreakdown(basic);
assert(breakdown1.baseAmount === 100000, 'Base amount correctly recorded');
assert(breakdown1.gstAmount === 18000, '18% GST on ₹1,00,000 equals ₹18,000');
assert(breakdown1.cgst === 9000 && breakdown1.sgst === 9000, 'CGST and SGST split equally (₹9,000 each)');
assert(breakdown1.totalAmount === 118000, 'Total Gross Amount equals ₹1,18,000');
assert(breakdown1.deductions.sdAmount === 5000, 'Auto 5% SD equals ₹5,000');
assert(breakdown1.deductions.tdsAmount === 2000, 'Auto 2% IT-TDS equals ₹2,000');
assert(breakdown1.deductions.labourCess === 1000, 'Auto 1% Labour Cess equals ₹1,000');
assert(breakdown1.totalDeductions === 8000, 'Total standard deductions equal ₹8,000');
assert(breakdown1.netPayable === 110000, 'Net payable equals ₹1,10,000 (1,18,000 - 8,000)');

// 1.3 Rounding test (two decimal currency precision)
const fractionalBase = 12345.67;
const breakdownRounding = calculateBillingBreakdown(fractionalBase);
assert(breakdownRounding.gstAmount === 2222.22, `Fractional GST correctly rounded: ${breakdownRounding.gstAmount}`);
assert(breakdownRounding.deductions.sdAmount === 617.28, `Fractional SD correctly rounded: ${breakdownRounding.deductions.sdAmount}`);
assert(breakdownRounding.deductions.tdsAmount === 246.91, `Fractional TDS correctly rounded: ${breakdownRounding.deductions.tdsAmount}`);
assert(breakdownRounding.deductions.labourCess === 123.46, `Fractional Cess correctly rounded: ${breakdownRounding.deductions.labourCess}`);

// 1.4 Zero values test
const zeroBreakdown = calculateBillingBreakdown(0);
assert(zeroBreakdown.baseAmount === 0, 'Zero base amount handled gracefully');
assert(zeroBreakdown.gstAmount === 0, 'Zero base produces zero GST');
assert(zeroBreakdown.totalDeductions === 0, 'Zero base produces zero total deductions');
assert(zeroBreakdown.netPayable === 0, 'Zero base produces zero net payable');

// 1.5 Invalid inputs test (negative values, string non-numbers)
const invalidBreakdown = calculateBillingBreakdown(-50000, -18);
assert(invalidBreakdown.baseAmount === 0, 'Negative base amount safely falls back to 0');
assert(invalidBreakdown.gstRate === 0, 'Negative GST rate safely falls back to 0%');

const nanBreakdown = calculateBillingBreakdown('invalid_text', 'bad_rate');
assert(nanBreakdown.baseAmount === 0, 'Non-numeric string safely falls back to 0');
assert(nanBreakdown.gstRate === DEFAULT_BILLING_RATES.gst.defaultRate, 'Invalid GST rate falls back to default 18%');

// 1.6 Manual override tracking
const overrideBreakdown = calculateBillingBreakdown(100000, 18, {
  sdAmount: 7500, // Overridden from auto 5,000
  tdsAmount: 2000, // Matches auto 2,000
  royalty: 1200,   // Manual entry
});
assert(overrideBreakdown.deductionBreakdown.sd.isOverridden === true, 'Overridden SD marked as isOverridden: true');
assert(overrideBreakdown.deductionBreakdown.sd.amount === 7500, 'Overridden SD amount preserved as ₹7,500');
assert(overrideBreakdown.deductionBreakdown.itTds.isOverridden === false, 'Matching TDS marked as isOverridden: false');
assert(overrideBreakdown.deductionBreakdown.royalty.amount === 1200, 'Manual Royalty recorded as ₹1,200');

// 1.7 Exemptions test
const exemptBreakdown = calculateBillingBreakdown(100000, 18, {
  sdAmountExempt: true,
  tdsAmountExempt: true,
});
assert(exemptBreakdown.deductionBreakdown.sd.isExempt === true, 'SD exemption tracked as isExempt: true');
assert(exemptBreakdown.deductionBreakdown.sd.amount === 0, 'Exempt SD produces ₹0 deduction');
assert(exemptBreakdown.deductionBreakdown.itTds.amount === 0, 'Exempt TDS produces ₹0 deduction');

// --------------------------------------------------------------------------
// SUITE 2: FMD / SD Expiry Warnings Service
// --------------------------------------------------------------------------
console.log('\n--- Suite 2: FMD / SD Expiry Warnings ---');

const testToday = new Date('2026-10-21T00:00:00');

// 2.1 Expired instrument
const expiredExpiry = calculateInstrumentExpiry('2026-10-10', 30, testToday);
assert(expiredExpiry.status === 'expired', 'Past validity date produces status: "expired"');
assert(expiredExpiry.daysRemaining === -11, 'Days remaining is negative for expired instrument (-11 days)');
assert(expiredExpiry.badgeVariant === 'danger', 'Expired badge variant is "danger"');

// 2.2 Expiring soon instrument (within 30 days)
const soonExpiry = calculateInstrumentExpiry('2026-11-05', 30, testToday);
assert(soonExpiry.status === 'expiring_soon', 'Date within 30 days produces status: "expiring_soon"');
assert(soonExpiry.daysRemaining === 15, 'Days remaining is 15 days');
assert(soonExpiry.badgeVariant === 'warning', 'Expiring soon badge variant is "warning"');

// 2.3 Active instrument (> 30 days)
const activeExpiry = calculateInstrumentExpiry('2027-03-31', 30, testToday);
assert(activeExpiry.status === 'active', 'Date beyond 30 days produces status: "active"');
assert(activeExpiry.daysRemaining > 30, 'Active instrument has > 30 days remaining');
assert(activeExpiry.badgeVariant === 'success', 'Active badge variant is "success"');

// 2.4 Configurable warning window
const customExpiry = calculateInstrumentExpiry('2026-11-15', 15, testToday); // 25 days away
assert(customExpiry.status === 'active', '25 days away with 15-day window is classified as "active"');
const customExpiry2 = calculateInstrumentExpiry('2026-11-15', 45, testToday);
assert(customExpiry2.status === 'expiring_soon', '25 days away with 45-day window is classified as "expiring_soon"');

// 2.5 Missing date handling
const noDateExpiry = calculateInstrumentExpiry(null, 30, testToday);
assert(noDateExpiry.status === 'no_date', 'Null date produces status: "no_date" without throwing');

// 2.6 List summarization
const sampleFmdList = [
  { id: 'fmd-1', validityDate: '2026-10-01', fmdStatus: 'Verified & Retained' }, // Expired
  { id: 'fmd-2', validityDate: '2026-11-01', fmdStatus: 'Verified & Retained' }, // Expiring soon (11d)
  { id: 'fmd-3', validityDate: '2027-05-01', fmdStatus: 'Verified & Retained' }, // Active
  { id: 'fmd-4', validityDate: '2026-10-01', fmdStatus: 'Released' },           // Released (ignored)
];
const summary = summarizeFmdExpiries(sampleFmdList, 30);
assert(summary.expiredCount >= 1, `Summarizer identifies expired instruments (found ${summary.expiredCount})`);
assert(summary.expiringSoonCount >= 1, `Summarizer identifies expiring-soon instruments (found ${summary.expiringSoonCount})`);
assert(summary.activeCount >= 1, `Summarizer identifies active instruments (found ${summary.activeCount})`);

// --------------------------------------------------------------------------
// SUITE 3: SD Release Clearance Gate
// --------------------------------------------------------------------------
console.log('\n--- Suite 3: SD Release Clearance Gate ---');

// 3.1 Non-released status passes automatically
const unreleasedGate = validateSdReleaseGate({ fmdStatus: 'Verified & Retained' });
assert(unreleasedGate.allowed === true, 'Non-released status passes clearance gate automatically');

// 3.2 Released status without clearance fields blocked
const invalidReleaseGate = validateSdReleaseGate({
  fmdStatus: 'Released',
  releaseOrderNumber: '',
  releaseApprovalDate: '',
  releaseApprovingAuthority: '',
  dlpClearanceStatus: false,
});
assert(invalidReleaseGate.allowed === false, 'Status "Released" blocked without clearance requirements');
assert(invalidReleaseGate.errors.releaseOrderNumber !== undefined, 'Error generated for missing release order number');
assert(invalidReleaseGate.errors.releaseApprovalDate !== undefined, 'Error generated for missing approval date');
assert(invalidReleaseGate.errors.releaseApprovingAuthority !== undefined, 'Error generated for missing approving authority');
assert(invalidReleaseGate.errors.dlpClearanceStatus !== undefined, 'Error generated for uncertified DLP');

// 3.3 Valid release clearance payload
const validReleaseGate = validateSdReleaseGate({
  fmdStatus: 'Released',
  releaseOrderNumber: 'RO-PWD-DIV1-2026-042',
  releaseApprovalDate: '2026-10-15',
  releaseApprovingAuthority: 'Executive Engineer, PWD Div 1',
  dlpClearanceStatus: true,
  finalBillPassed: true,
  noDuesCertificate: true,
});
assert(validReleaseGate.allowed === true, 'Clearance gate opens when all statutory approvals and DLP are recorded');
assert(Object.keys(validReleaseGate.errors).length === 0, 'No validation errors on certified release');

// --------------------------------------------------------------------------
// SUITE 4: Work Order Amendments & Baseline Preservation
// --------------------------------------------------------------------------
console.log('\n--- Suite 4: Work Order Amendments & Baseline Preservation ---');

const initialWorkOrder = {
  id: 'wo-test-01',
  workOrderNumber: 'WO-2024-TEST-001',
  tenderNumber: 'TN-2024-88',
  workOrderAmount: 5000000, // ₹50 Lakhs
  stipulatedDateOfCompletion: '2025-06-30',
  status: 'In Progress',
};

// 4.1 Resolve baseline
const baseline = getWorkOrderBaseline(initialWorkOrder);
assert(baseline.originalSanctionedAmount === 5000000, 'Original sanctioned baseline amount resolved as ₹50,00,000');
assert(baseline.originalStipulatedCompletionDate === '2025-06-30', 'Original stipulated completion date resolved');

// 4.2 Propose an amendment
const amendedWO = createProposedAmendment(initialWorkOrder, {
  referenceNumber: 'CE-PWD-REV-2026-012',
  amendmentDate: '2026-10-21',
  reason: 'Additional foundation depth due to canal flood strata survey',
  proposedAmount: 5600000, // ₹56 Lakhs (variation +₹6,00,000)
  proposedCompletionDate: '2025-09-30',
  timeExtensionDays: 92,
  submittedBy: 'Executive Engineer, PWD Div 1',
});

// CRITICAL CHECKS: Baseline preserved & current values NOT overwritten silently
assert(amendedWO.originalSanctionedAmount === 5000000, 'Original baseline amount preserved intact');
assert(amendedWO.originalStipulatedCompletionDate === '2025-06-30', 'Original baseline completion date preserved intact');
assert(amendedWO.workOrderAmount === 5000000, 'Active workOrderAmount NOT silently overwritten while amendment is pending');
assert(amendedWO.stipulatedDateOfCompletion === '2025-06-30', 'Active completion date NOT silently overwritten');
assert(Array.isArray(amendedWO.amendments) && amendedWO.amendments.length === 1, 'Amendment added to amendments list');

const recordedAmd = amendedWO.amendments[0];
assert(recordedAmd.status === 'Pending Departmental Approval', 'Amendment status is "Pending Departmental Approval"');
assert(recordedAmd.amountVariation === 600000, 'Amount variation computed correctly (+₹6,00,000)');
assert(recordedAmd.referenceNumber === 'CE-PWD-REV-2026-012', 'Reference dispatch number recorded');
assert(recordedAmd.timeExtensionDays === 92, 'Time extension days recorded');

// 4.3 Validation of amendment input
const invalidInput = validateAmendmentInput({ referenceNumber: '', amendmentDate: '', reason: '' });
assert(invalidInput.isValid === false, 'Invalid amendment input caught');
assert(invalidInput.errors.referenceNumber !== undefined, 'Reference number validation error present');

// --------------------------------------------------------------------------
// SUITE 5: Audit Trail & Data Sanitization
// --------------------------------------------------------------------------
console.log('\n--- Suite 5: Audit Trail & Sensitive Data Sanitization ---');

// 5.1 Sensitive data stripping
const sensitivePayload = {
  username: 'officer1',
  password: 'super_secret_password_123',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token',
  dataUrl: 'data:application/pdf;base64,JVBERi0xLjQK...',
  amount: 450000,
  uploadedDocuments: [{ name: 'scan.pdf', dataUrl: 'base64...' }],
};

const cleaned = sanitizeAuditData(sensitivePayload);
assert(cleaned.password === '[REDACTED_FOR_AUDIT]', 'Passwords are redacted from audit data');
assert(cleaned.token === '[REDACTED_FOR_AUDIT]', 'Tokens are redacted from audit data');
assert(cleaned.dataUrl === '[REDACTED_FOR_AUDIT]', 'Data URLs are redacted from audit data');
assert(cleaned.amount === 450000, 'Business numerical amounts are preserved');

// 5.2 Field diff computation
const oldRec = { amount: 100000, status: 'Submitted', remarks: 'Init' };
const newRec = { amount: 120000, status: 'Passed', remarks: 'Init' };
const diff = computeChangedFieldsSummary(oldRec, newRec);
assert(Array.isArray(diff) && diff.length === 2, 'Diff computes exactly 2 changed fields');
const amountChange = diff.find((d) => d.field === 'amount');
assert(amountChange.from === '100000' && amountChange.to === '120000', 'Amount diff captured accurately');

// 5.3 Failure logging verification (Ensure failed operations don't log success)
assert(typeof auditService.logFailure === 'function', 'auditService provides dedicated logFailure method');

console.log('\n=============================================================');
console.log(`Phase 2 Automated Verification Results: ${passed} PASSED, ${failed} FAILED`);
console.log('=============================================================\n');

if (failed > 0) {
  process.exit(1);
}
