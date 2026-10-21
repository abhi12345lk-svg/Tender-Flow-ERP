import React from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Receipt, Calendar, Building, Calculator, CheckCircle2, Printer } from 'lucide-react';

export default function BillingDetailModal({ isOpen, onClose, billing, onEdit }) {
  if (!billing) return null;

  const deductions = billing.deductions || {};
  const totalDeductions =
    (deductions.sdAmount || 0) +
    (deductions.tdsAmount || 0) +
    (deductions.labourCess || 0) +
    (deductions.royalty || 0) +
    (deductions.penalty || 0);

  const netPayable = billing.netPayable ?? (billing.totalAmount - totalDeductions);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bill Voucher: ${billing.invoiceNumber}`}
      subtitle={`Related Work Order: ${billing.workOrderNumber} | Subdivision: ${billing.subdivisionName || 'General'}`}
      size="lg"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Voucher Ref: <span className="font-mono font-semibold text-slate-800">{billing.invoiceNumber}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
            <Button
              variant="navy"
              icon={Printer}
              onClick={handlePrint}
              className="w-full sm:w-auto shadow-sm text-xs"
            >
              Print / Save PDF Voucher
            </Button>
            {onEdit && (
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  onEdit(billing);
                }}
                className="w-full sm:w-auto shadow-sm text-xs"
              >
                Edit Bill Record
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs no-print">
        {/* Status Header */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div>
            <span className="text-slate-400 block mb-0.5">Contractor / Vendor</span>
            <span className="font-bold text-slate-900 text-sm">{billing.contractorName}</span>
          </div>
          <Badge variant={billing.status}>{billing.status}</Badge>
        </div>

        {/* Work Order & Date Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="p-2.5 border rounded-lg bg-white">
            <span className="text-slate-400 block mb-0.5">Invoice Date</span>
            <span className="font-semibold text-slate-800">{formatDate(billing.invoiceDate)}</span>
          </div>
          <div className="p-2.5 border rounded-lg bg-white">
            <span className="text-slate-400 block mb-0.5">Date of Completion</span>
            <span className="font-semibold text-slate-800">{formatDate(billing.dateOfCompletion)}</span>
          </div>
          <div className="p-2.5 border rounded-lg bg-white">
            <span className="text-slate-400 block mb-0.5">Date of Handover</span>
            <span className="font-semibold text-slate-800">{formatDate(billing.dateOfHandover)}</span>
          </div>
          <div className="p-2.5 border rounded-lg bg-white">
            <span className="text-slate-400 block mb-0.5">Tender Number (M)</span>
            <span className="font-mono font-semibold text-slate-800">{billing.tenderNumber}</span>
          </div>
        </div>

        {/* Valuation & GST Breakdown */}
        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
          <h4 className="font-bold uppercase tracking-wider text-blue-900">
            Valuation & GST Computation
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="p-2.5 rounded bg-white border border-blue-100">
              <span className="text-slate-500 block mb-0.5">Basic Amount</span>
              <span className="font-bold text-slate-900 text-sm font-mono">{formatCurrency(billing.amount)}</span>
            </div>
            <div className="p-2.5 rounded bg-white border border-blue-100">
              <span className="text-slate-500 block mb-0.5">GST ({billing.gstRate || 18}%)</span>
              <span className="font-bold text-blue-700 text-sm font-mono">
                {formatCurrency(billing.gstAmount || (billing.amount * (billing.gstRate || 18)) / 100)}
              </span>
            </div>
            <div className="p-2.5 rounded bg-white border border-blue-100">
              <span className="text-slate-500 block mb-0.5">Total Amount (Gross)</span>
              <span className="font-bold text-blue-900 text-sm font-mono">{formatCurrency(billing.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Deductions Breakdown */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="font-bold uppercase tracking-wider text-slate-800">
              Statutory Deductions Applied
            </h4>
            <span className="font-bold text-rose-700 font-mono">
              Total: {formatCurrency(totalDeductions)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <div className="p-2 rounded bg-white border border-slate-200">
              <span className="text-slate-400 block mb-0.5">SD (Retention)</span>
              <span className="font-semibold text-slate-800 font-mono">{formatCurrency(deductions.sdAmount || 0)}</span>
            </div>
            <div className="p-2 rounded bg-white border border-slate-200">
              <span className="text-slate-400 block mb-0.5">TDS (Income Tax)</span>
              <span className="font-semibold text-slate-800 font-mono">{formatCurrency(deductions.tdsAmount || 0)}</span>
            </div>
            <div className="p-2 rounded bg-white border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Labour Cess (1%)</span>
              <span className="font-semibold text-slate-800 font-mono">{formatCurrency(deductions.labourCess || 0)}</span>
            </div>
            <div className="p-2 rounded bg-white border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Royalty</span>
              <span className="font-semibold text-slate-800 font-mono">{formatCurrency(deductions.royalty || 0)}</span>
            </div>
            <div className="p-2 rounded bg-white border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Penalty / Withheld</span>
              <span className="font-semibold text-slate-800 font-mono">{formatCurrency(deductions.penalty || 0)}</span>
            </div>
          </div>

          <div className="p-3 mt-2 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <span className="font-bold text-emerald-900 block text-xs">Net Passed Disbursable Amount:</span>
              <span className="text-[10px] text-emerald-700">Gross Total minus all Statutory Deductions</span>
            </div>
            <div className="text-base font-extrabold text-emerald-800 font-mono">
              {formatCurrency(netPayable)}
            </div>
          </div>
        </div>

        {billing.remarks && (
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-600">
            <span className="font-semibold text-slate-700 block mb-0.5">Scrutiny Remarks:</span>
            {billing.remarks}
          </div>
        )}
      </div>

      {/* Printable Official PWD Contractor Running Account Bill Voucher */}
      <div id="printable-document" className="hidden print:block bg-white p-6 font-sans text-slate-900 space-y-4 max-w-3xl mx-auto">
        <div className="text-center border-b-2 border-slate-900 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">
            GOVERNMENT OF STATE / सरकारी लोक निर्माण विभाग
          </h2>
          <h3 className="text-sm font-extrabold uppercase mt-0.5">
            OFFICE OF THE EXECUTIVE ENGINEER, DIVISION NO. 1
          </h3>
          <p className="text-xs font-semibold text-slate-800">
            CONTRACTOR'S RUNNING ACCOUNT BILL VOUCHER & STATUTORY SCRUTINY CERTIFICATE
          </p>
          <div className="flex justify-center gap-4 text-[10px] text-slate-500 mt-1 font-mono">
            <span>Invoice Ref: {billing.invoiceNumber}</span>
            <span>•</span>
            <span>Work Order: {billing.workOrderNumber}</span>
            <span>•</span>
            <span>Tender: {billing.tenderNumber}</span>
          </div>
        </div>

        <div className="border p-3 rounded bg-slate-50 text-xs grid grid-cols-2 gap-2">
          <div><span className="font-semibold text-slate-600 block">Awarded Contractor:</span><span className="font-bold text-slate-900">{billing.contractorName}</span></div>
          <div><span className="font-semibold text-slate-600 block">Subdivision Association:</span><span className="font-bold text-slate-900">{billing.subdivisionName || 'General'}</span></div>
          <div><span className="font-semibold text-slate-600 block">Invoice Date:</span><span className="text-slate-900">{formatDate(billing.invoiceDate)}</span></div>
          <div><span className="font-semibold text-slate-600 block">Date of Completion:</span><span className="text-slate-900">{formatDate(billing.dateOfCompletion)}</span></div>
          <div><span className="font-semibold text-slate-600 block">Date of Handover:</span><span className="text-slate-900">{formatDate(billing.dateOfHandover)}</span></div>
          <div><span className="font-semibold text-slate-600 block">Bill Status:</span><span className="font-bold text-slate-900">{billing.status}</span></div>
        </div>

        {/* Valuation Table */}
        <div className="border rounded overflow-hidden text-xs">
          <div className="bg-slate-100 p-2 font-bold uppercase text-slate-800 border-b">
            A. Work Valuation & GST Computation
          </div>
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2 text-slate-600">Basic Value of Works Executed:</td>
                <td className="p-2 font-mono font-bold text-right text-slate-900">{formatCurrency(billing.amount)}</td>
              </tr>
              <tr>
                <td className="p-2 text-slate-600">Goods and Services Tax GST ({billing.gstRate || 18}%):</td>
                <td className="p-2 font-mono font-bold text-right text-blue-700">{formatCurrency(billing.gstAmount || (billing.amount * (billing.gstRate || 18)) / 100)}</td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="p-2 text-slate-800 uppercase">Gross Bill Amount (Basic + GST):</td>
                <td className="p-2 font-mono text-right text-blue-900">{formatCurrency(billing.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Deductions Table */}
        <div className="border rounded overflow-hidden text-xs">
          <div className="bg-slate-100 p-2 font-bold uppercase text-slate-800 border-b">
            B. Departmental & Statutory Deductions
          </div>
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2 text-slate-600">Security Deposit SD Retention (5% / 10%):</td>
                <td className="p-2 font-mono text-right text-rose-700">{formatCurrency(deductions.sdAmount || 0)}</td>
              </tr>
              <tr>
                <td className="p-2 text-slate-600">Income Tax TDS (Section 194C - 2%):</td>
                <td className="p-2 font-mono text-right text-rose-700">{formatCurrency(deductions.tdsAmount || 0)}</td>
              </tr>
              <tr>
                <td className="p-2 text-slate-600">Building & Other Construction Workers Labour Cess (1%):</td>
                <td className="p-2 font-mono text-right text-rose-700">{formatCurrency(deductions.labourCess || 0)}</td>
              </tr>
              <tr>
                <td className="p-2 text-slate-600">Royalty / Material Clearance / Penalty:</td>
                <td className="p-2 font-mono text-right text-rose-700">{formatCurrency((deductions.royalty || 0) + (deductions.penalty || 0))}</td>
              </tr>
              <tr className="bg-rose-50 font-bold">
                <td className="p-2 text-rose-900 uppercase">Total Deductions & Retentions:</td>
                <td className="p-2 font-mono text-right text-rose-900">{formatCurrency(totalDeductions)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Net Payable Highlight */}
        <div className="p-3 rounded bg-emerald-50 border-2 border-emerald-300 flex items-center justify-between text-xs">
          <div>
            <span className="font-extrabold uppercase text-emerald-900 block text-xs">Net Passed & Disbursable Amount:</span>
            <span className="text-[10px] text-emerald-700">Certified for Treasury / Bank Payment Voucher</span>
          </div>
          <div className="text-lg font-black text-emerald-900 font-mono">
            {formatCurrency(netPayable)}
          </div>
        </div>

        {/* Official Signatures */}
        <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
          <div>
            <p className="text-slate-500 font-medium">Audited & Scrutinized by:</p>
            <div className="mt-8 border-t border-slate-400 w-44 mb-1"></div>
            <p className="font-bold text-slate-900">Divisional Accountant (DA)</p>
            <p className="text-slate-500 text-[11px]">Accounts Branch, Division 1</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="text-slate-500 font-medium">Passed for Payment by:</p>
            <div className="mt-8 border-t border-slate-400 w-44 mb-1 sm:ml-auto"></div>
            <p className="font-bold text-slate-900">Executive Engineer</p>
            <p className="text-slate-500 text-[11px]">Public Works Division No. 1</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
