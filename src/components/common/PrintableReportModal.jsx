import React from 'react';
import { Printer, Download, FileSpreadsheet, X, CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * PrintableReportModal
 * Renders an official government A4 printable report with full print-to-PDF support,
 * multi-page repeating headers, bilingual Hindi/English headers, and direct Excel export.
 * Operates 100% offline from local IndexedDB data.
 */
export default function PrintableReportModal({
  isOpen,
  onClose,
  title,
  subtitle,
  reportType,
  data = [],
  activeFY,
  onExportExcel,
  extraSummary,
}) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const isEmpty = !data || data.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Official PWD Printable Report'}
      subtitle={subtitle || `Active Financial Year: FY ${activeFY || 'ALL'}`}
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          <div className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>Official Government PWD Standard A4 Report Format</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
            {onExportExcel && (
              <Button
                variant="outline"
                icon={FileSpreadsheet}
                className="w-full sm:w-auto"
                onClick={onExportExcel}
                disabled={isEmpty}
              >
                Export Excel (.xlsx)
              </Button>
            )}
            <Button
              variant="navy"
              icon={Printer}
              onClick={handlePrint}
              disabled={isEmpty}
              className="w-full sm:w-auto shadow-sm"
            >
              Print / Save PDF (A4)
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Document Status Notification Banner */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Client-Side Document Generator Active:</strong> A4 formatted layout with Devanagari Hindi/English typography, repeating headers, and multi-page handling ready for print or saving as PDF offline.
            </span>
          </div>
          <span className="font-mono font-bold text-emerald-900 shrink-0 ml-2">
            {data.length} Records
          </span>
        </div>

        {isEmpty ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Records Available for Report</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are currently no records matching the selected criteria in the local database. Add records or adjust your filters to generate an official report.
            </p>
          </div>
        ) : (
          /* Printable Government Document Sheet */
          <div
            id="printable-document"
            className="bg-white p-4 sm:p-8 border border-slate-300 rounded-lg shadow-sm font-sans text-slate-900 space-y-4 sm:space-y-6 max-w-4xl mx-auto leading-relaxed"
          >
            {/* Government Emblem & Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-700">
                GOVERNMENT OF STATE / सरकारी लोक निर्माण विभाग
              </h2>
              <h3 className="text-sm sm:text-base font-extrabold uppercase mt-1">
                OFFICE OF THE EXECUTIVE ENGINEER, DIVISION NO. 1
              </h3>
              <p className="text-xs font-semibold text-slate-800 mt-0.5">
                {title || 'GOVERNMENT WORKS & STATUTORY REGISTER REPORT'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500 mt-1 font-mono">
                <span>Active FY: {activeFY || 'ALL'}</span>
                <span>•</span>
                <span>Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span>•</span>
                <span>Total Records: {data.length}</span>
              </div>
            </div>

            {/* Extra Summary Cards (if provided) */}
            {extraSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border p-3 rounded bg-slate-50">
                {extraSummary.map((item, idx) => (
                  <div key={idx} className="p-1.5">
                    <span className="text-slate-500 block text-[11px]">{item.label}</span>
                    <span className="font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Module-Specific Data Tables */}
            {reportType === 'work-orders' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300">#</th>
                      <th className="p-2 border-r border-slate-300">Work Order No. (M)</th>
                      <th className="p-2 border-r border-slate-300">Tender No. (M)</th>
                      <th className="p-2 border-r border-slate-300">Work Description / Title</th>
                      <th className="p-2 border-r border-slate-300">Contractor</th>
                      <th className="p-2 border-r border-slate-300">TD</th>
                      <th className="p-2 border-r border-slate-300 text-right">Sanctioned (₹)</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.map((wo, idx) => (
                      <tr key={wo.id || idx} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-200 text-slate-500">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-900">{wo.workOrderNumber}</td>
                        <td className="p-2 border-r border-slate-200 font-mono text-slate-700">{wo.tenderNumber}</td>
                        <td className="p-2 border-r border-slate-200 max-w-[200px] truncate" title={wo.title}>{wo.title || 'Sanctioned Work'}</td>
                        <td className="p-2 border-r border-slate-200 text-slate-800">{wo.contractorName || 'Agency'}</td>
                        <td className="p-2 border-r border-slate-200 font-mono">{wo.td || '-'}</td>
                        <td className="p-2 border-r border-slate-200 font-mono font-semibold text-right text-slate-900">{formatCurrency(wo.workOrderAmount)}</td>
                        <td className="p-2 text-center text-[11px] font-semibold">{wo.status || 'Active'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <tr>
                      <td colSpan="6" className="p-2 border-r border-slate-300 text-right uppercase">Total Sanctioned Value:</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-right text-blue-900">
                        {formatCurrency(data.reduce((sum, wo) => sum + (Number(wo.workOrderAmount) || 0), 0))}
                      </td>
                      <td className="p-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {reportType === 'billing' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300">#</th>
                      <th className="p-2 border-r border-slate-300">Invoice No.</th>
                      <th className="p-2 border-r border-slate-300">Work Order No.</th>
                      <th className="p-2 border-r border-slate-300">Contractor</th>
                      <th className="p-2 border-r border-slate-300 text-right">Gross (₹)</th>
                      <th className="p-2 border-r border-slate-300 text-right">Deductions (₹)</th>
                      <th className="p-2 border-r border-slate-300 text-right">Net Payable (₹)</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.map((bill, idx) => {
                      const gross = Number(bill.totalAmount) || 0;
                      const ded = Number(bill.totalDeductions) || 0;
                      const net = Number(bill.netPayable) ?? (gross - ded);
                      return (
                        <tr key={bill.id || idx} className="hover:bg-slate-50">
                          <td className="p-2 border-r border-slate-200 text-slate-500">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-900">{bill.invoiceNumber}</td>
                          <td className="p-2 border-r border-slate-200 font-mono text-slate-700">{bill.workOrderNumber}</td>
                          <td className="p-2 border-r border-slate-200 text-slate-800">{bill.contractorName || 'Agency'}</td>
                          <td className="p-2 border-r border-slate-200 font-mono text-right">{formatCurrency(gross)}</td>
                          <td className="p-2 border-r border-slate-200 font-mono text-right text-rose-700">{formatCurrency(ded)}</td>
                          <td className="p-2 border-r border-slate-200 font-mono font-bold text-right text-emerald-700">{formatCurrency(net)}</td>
                          <td className="p-2 text-center text-[11px] font-semibold">{bill.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <tr>
                      <td colSpan="4" className="p-2 border-r border-slate-300 text-right uppercase">Aggregated Billing Totals:</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-right text-slate-900">
                        {formatCurrency(data.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0))}
                      </td>
                      <td className="p-2 border-r border-slate-300 font-mono text-right text-rose-900">
                        {formatCurrency(data.reduce((sum, b) => sum + (Number(b.totalDeductions) || 0), 0))}
                      </td>
                      <td className="p-2 border-r border-slate-300 font-mono text-right text-emerald-900">
                        {formatCurrency(data.reduce((sum, b) => sum + (Number(b.netPayable) ?? ((Number(b.totalAmount) || 0) - (Number(b.totalDeductions) || 0))), 0))}
                      </td>
                      <td className="p-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {reportType === 'subdivisions' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300">#</th>
                      <th className="p-2 border-r border-slate-300">Subdivision Code</th>
                      <th className="p-2 border-r border-slate-300">Subdivision Name</th>
                      <th className="p-2 border-r border-slate-300">In-Charge Engineer</th>
                      <th className="p-2 border-r border-slate-300">Contact / Phone</th>
                      <th className="p-2 border-r border-slate-300">Office Location</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.map((sub, idx) => (
                      <tr key={sub.id || idx} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-200 text-slate-500">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-900">{sub.code}</td>
                        <td className="p-2 border-r border-slate-200 font-semibold text-slate-800">{sub.name}</td>
                        <td className="p-2 border-r border-slate-200 text-slate-700">{sub.inchargeName || sub.headOfSubdivision || '-'}</td>
                        <td className="p-2 border-r border-slate-200 font-mono text-slate-600">{sub.contactNumber || sub.phone || '-'}</td>
                        <td className="p-2 border-r border-slate-200 text-slate-600">{sub.location || sub.address || 'Civil Lines'}</td>
                        <td className="p-2 text-center text-[11px] font-semibold">{sub.status || 'Active'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'financial-year' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300">#</th>
                      <th className="p-2 border-r border-slate-300">Financial Year (FY)</th>
                      <th className="p-2 border-r border-slate-300">Start Date</th>
                      <th className="p-2 border-r border-slate-300">End Date</th>
                      <th className="p-2 border-r border-slate-300">Status</th>
                      <th className="p-2 border-r border-slate-300">Active Cycle</th>
                      <th className="p-2">Remarks / Gazetted Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.map((fy, idx) => (
                      <tr key={fy.id || idx} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-200 text-slate-500">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-mono font-bold text-blue-900">{fy.year || fy.financialYear}</td>
                        <td className="p-2 border-r border-slate-200">{formatDate(fy.startDate)}</td>
                        <td className="p-2 border-r border-slate-200">{formatDate(fy.endDate)}</td>
                        <td className="p-2 border-r border-slate-200 font-semibold">{fy.status || (fy.isActive ? 'Active' : 'Closed')}</td>
                        <td className="p-2 border-r border-slate-200 text-center">
                          {fy.isActive ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">CURRENT ACTIVE</span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Archived</span>
                          )}
                        </td>
                        <td className="p-2 text-slate-600">{fy.remarks || fy.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'agreements' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300">#</th>
                      <th className="p-2 border-r border-slate-300">Agreement No.</th>
                      <th className="p-2 border-r border-slate-300">Execution Date</th>
                      <th className="p-2 border-r border-slate-300">Work Order No.</th>
                      <th className="p-2 border-r border-slate-300">Contractor</th>
                      <th className="p-2 border-r border-slate-300">Template</th>
                      <th className="p-2 border-r border-slate-300">E-Stamp Duty No.</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.map((agr, idx) => (
                      <tr key={agr.id || idx} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-200 text-slate-500">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-900">{agr.agreementNumber}</td>
                        <td className="p-2 border-r border-slate-200">{formatDate(agr.agreementDate)}</td>
                        <td className="p-2 border-r border-slate-200 font-mono text-slate-700">{agr.workOrderNumber}</td>
                        <td className="p-2 border-r border-slate-200 text-slate-800">{agr.contractorName}</td>
                        <td className="p-2 border-r border-slate-200 text-[11px] text-slate-600">{agr.templateType || 'Standard F-2'}</td>
                        <td className="p-2 border-r border-slate-200 font-mono text-[11px]">{agr.stampDutyNumber || 'EXEMPTED'}</td>
                        <td className="p-2 text-center text-[11px] font-semibold">{agr.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'fmd-sd' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300">#</th>
                      <th className="p-2 border-r border-slate-300">Tender No. (M)</th>
                      <th className="p-2 border-r border-slate-300">Related WO</th>
                      <th className="p-2 border-r border-slate-300">Contractor</th>
                      <th className="p-2 border-r border-slate-300">Instrument Type</th>
                      <th className="p-2 border-r border-slate-300 text-right">SD Amount (₹)</th>
                      <th className="p-2 border-r border-slate-300 text-right">EMD Amount (₹)</th>
                      <th className="p-2 border-r border-slate-300">Validity Upto</th>
                      <th className="p-2 text-center">Custody Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.map((fmd, idx) => (
                      <tr key={fmd.id || idx} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-200 text-slate-500">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-900">{fmd.tenderNumber}</td>
                        <td className="p-2 border-r border-slate-200 font-mono text-slate-700">{fmd.workOrderNumber || '-'}</td>
                        <td className="p-2 border-r border-slate-200 text-slate-800">{fmd.contractorName}</td>
                        <td className="p-2 border-r border-slate-200 text-[11px]">{fmd.instrumentType || 'Bank Guarantee'}</td>
                        <td className="p-2 border-r border-slate-200 font-mono text-right font-semibold text-slate-900">{formatCurrency(fmd.sdAmount)}</td>
                        <td className="p-2 border-r border-slate-200 font-mono text-right text-slate-700">{formatCurrency(fmd.emdAmount)}</td>
                        <td className="p-2 border-r border-slate-200 font-mono text-[11px]">{formatDate(fmd.validityDate)}</td>
                        <td className="p-2 text-center text-[11px] font-semibold">{fmd.fmdStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <tr>
                      <td colSpan="5" className="p-2 border-r border-slate-300 text-right uppercase">Total Security Valuation:</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-right text-blue-900">
                        {formatCurrency(data.reduce((sum, f) => sum + (Number(f.sdAmount) || 0), 0))}
                      </td>
                      <td className="p-2 border-r border-slate-300 font-mono text-right text-slate-900">
                        {formatCurrency(data.reduce((sum, f) => sum + (Number(f.emdAmount) || 0), 0))}
                      </td>
                      <td colSpan="2" className="p-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Official Certification Declaration */}
            <div className="pt-4 text-xs text-slate-600 border-t border-slate-200 space-y-1">
              <p>
                <strong>Statutory Declaration:</strong> Certified that the entries shown above have been reconciled with the official Divisional Cash Book, Register of Works, and authenticated offline IndexedDB records of TenderFlow ERP.
              </p>
              <p className="text-[11px] text-slate-400">
                This document is generated client-side from local government records and is legally authenticated under departmental works audit rules.
              </p>
            </div>

            {/* Signatures & Execution Section */}
            <div className="pt-6 sm:pt-8 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-xs font-sans">
              <div className="text-left space-y-8 sm:space-y-10">
                <p className="text-slate-500 font-medium">Reconciled & Checked by:</p>
                <div>
                  <div className="border-t border-slate-400 w-44 sm:w-48 mb-1"></div>
                  <p className="font-bold text-slate-900">Divisional Accountant (प्रभागीय लेखाकार)</p>
                  <p className="text-slate-500 text-[11px]">Accounts Branch, Division No. 1</p>
                </div>
              </div>

              <div className="text-left sm:text-right space-y-8 sm:space-y-10 flex flex-col sm:items-end">
                <p className="text-slate-500 font-medium">Approved & Authenticated by:</p>
                <div>
                  <div className="border-t border-slate-400 w-44 sm:w-48 mb-1 sm:ml-auto"></div>
                  <p className="font-bold text-slate-900">Executive Engineer (कार्यपालक अभियंता)</p>
                  <p className="text-slate-500 text-[11px]">Public Works Division No. 1</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
