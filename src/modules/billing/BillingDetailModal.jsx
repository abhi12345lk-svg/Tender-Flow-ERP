import React from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Receipt, Calendar, Building, Calculator, CheckCircle2 } from 'lucide-react';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bill Voucher: ${billing.invoiceNumber}`}
      subtitle={`Related Work Order: ${billing.workOrderNumber} | Subdivision: ${billing.subdivisionName || 'General'}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
          {onEdit && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onEdit(billing);
              }}
              className="w-full sm:w-auto shadow-sm"
            >
              Edit Bill Record
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4 text-xs">
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
    </Modal>
  );
}
