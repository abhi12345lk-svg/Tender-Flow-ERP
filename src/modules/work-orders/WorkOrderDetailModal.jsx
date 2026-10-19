import React from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FileText, Building, Calendar, IndianRupee, ShieldCheck, Tag } from 'lucide-react';

export default function WorkOrderDetailModal({ isOpen, onClose, workOrder, onEdit }) {
  if (!workOrder) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Work Order: ${workOrder.workOrderNumber}`}
      subtitle={`Tender Ref: ${workOrder.tenderNumber} | Financial Year: FY ${workOrder.financialYear}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {onEdit && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onEdit(workOrder);
              }}
            >
              Edit Work Order
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {/* Title Banner */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Project Description
            </span>
            <Badge variant={workOrder.status}>{workOrder.status}</Badge>
          </div>
          <h3 className="text-base font-bold text-slate-900 leading-snug">
            {workOrder.title || 'Government Infrastructure Work Order'}
          </h3>
          <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Contractor / Agency:</span>
            <span className="text-blue-700 font-medium">
              {workOrder.contractorName || 'Registered PWD Vendor'}
            </span>
          </div>
        </div>

        {/* Core Field Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 border rounded-lg bg-white">
            <span className="text-slate-400 block mb-0.5">Tender Number (M)</span>
            <span className="font-mono font-bold text-slate-900">{workOrder.tenderNumber}</span>
          </div>

          <div className="p-3 border rounded-lg bg-white">
            <span className="text-slate-400 block mb-0.5">Work Order Number (M)</span>
            <span className="font-mono font-bold text-slate-900">{workOrder.workOrderNumber}</span>
          </div>

          <div className="p-3 border rounded-lg bg-white">
            <span className="text-slate-400 block mb-0.5">Work Order Date</span>
            <span className="font-semibold text-slate-800">{formatDate(workOrder.workOrderDate)}</span>
          </div>

          <div className="p-3 border rounded-lg bg-white">
            <span className="text-slate-400 block mb-0.5">TD (Preserved)</span>
            <span className="font-semibold text-slate-800">{workOrder.td || '-'}</span>
          </div>

          <div className="p-3 border rounded-lg bg-white">
            <span className="text-slate-400 block mb-0.5">Estimate Number</span>
            <span className="font-semibold text-slate-800">{workOrder.estimateNumber || '-'}</span>
          </div>

          <div className="p-3 border rounded-lg bg-white">
            <span className="text-slate-400 block mb-0.5">Subdivision Association</span>
            <span className="font-semibold text-slate-800">{workOrder.subdivisionName || 'General Division'}</span>
          </div>
        </div>

        {/* Financial Valuation Card */}
        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
            <IndianRupee className="h-4 w-4 text-blue-700" />
            Financial & Deposit Provisions
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-white border border-blue-200">
              <span className="text-slate-500 block mb-0.5">Work Order Amount</span>
              <span className="text-base font-bold text-blue-700">
                {formatCurrency(workOrder.workOrderAmount)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-white border border-blue-200">
              <span className="text-slate-500 block mb-0.5">
                EMD Amount ({workOrder.emdNumber || 'No EMD Ref'})
              </span>
              <span className="text-sm font-bold text-slate-800">
                {formatCurrency(workOrder.emdAmount)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-white border border-blue-200">
              <span className="text-slate-500 block mb-0.5">SD Amount (Security Deposit)</span>
              <span className="text-sm font-bold text-slate-800">
                {formatCurrency(workOrder.sdAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Handover & Timeline */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">Stipulated Date of Completion:</span>
            <span className="font-semibold text-slate-800">
              {formatDate(workOrder.stipulatedDateOfCompletion)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Sample Govt. Record</span>
        </div>
      </div>
    </Modal>
  );
}
