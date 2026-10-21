import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { printElement } from '../../utils/printHelper';
import { api } from '../../services/apiClient';
import { dataService } from '../../services/dataService';
import { useApp } from '../../context/AppContext';
import {
  getWorkOrderBaseline,
  createProposedAmendment,
  validateAmendmentInput,
} from '../../services/workOrders/amendmentService';
import {
  FileText,
  Building,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Tag,
  Receipt,
  FileSignature,
  Layers,
  ArrowRight,
  TrendingUp,
  Printer,
  Plus,
  History,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export default function WorkOrderDetailModal({ isOpen, onClose, workOrder, onEdit }) {
  const { updateWorkOrder } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [related, setRelated] = useState(null);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Proposed Amendment Form State
  const [isAddingAmendment, setIsAddingAmendment] = useState(false);
  const [amendmentForm, setAmendmentForm] = useState({
    referenceNumber: '',
    amendmentDate: new Date().toISOString().split('T')[0],
    reason: '',
    proposedAmount: '',
    proposedCompletionDate: '',
    timeExtensionDays: '',
    submittedBy: 'Assistant Engineer / Executive Engineer',
    remarks: '',
  });
  const [amendmentErrors, setAmendmentErrors] = useState({});

  useEffect(() => {
    if (!isOpen || !workOrder) {
      setRelated(null);
      return;
    }

    const fetchRelated = async () => {
      const woId = workOrder._id || workOrder.id;
      if (!woId) return;

      try {
        setLoadingRelated(true);
        let relatedData = null;

        // Try backend if connected
        try {
          const res = await api.workOrders.getById(woId);
          if (res?.data?.related) {
            relatedData = res.data.related;
          }
        } catch {
          // Offline fallback
        }

        // If backend was not reached or returned empty, compute from local Dexie IndexedDB
        if (!relatedData) {
          relatedData = await dataService.getRelatedRecordsForWorkOrder(workOrder);
        }

        setRelated(relatedData);
      } catch (err) {
        console.warn('Could not load related records:', err.message);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelated();
  }, [isOpen, workOrder]);

  if (!workOrder) return null;

  const baseline = getWorkOrderBaseline(workOrder);
  const amendments = Array.isArray(workOrder.amendments) ? workOrder.amendments : [];

  const handleCreateAmendment = async (e) => {
    e.preventDefault();
    const validation = validateAmendmentInput(amendmentForm);
    if (!validation.isValid) {
      setAmendmentErrors(validation.errors);
      return;
    }

    const updatedWo = createProposedAmendment(workOrder, amendmentForm);
    const targetId = workOrder._id || workOrder.id;
    await updateWorkOrder(targetId, updatedWo);

    setIsAddingAmendment(false);
    setAmendmentForm({
      referenceNumber: '',
      amendmentDate: new Date().toISOString().split('T')[0],
      reason: '',
      proposedAmount: '',
      proposedCompletionDate: '',
      timeExtensionDays: '',
      submittedBy: 'Assistant Engineer / Executive Engineer',
      remarks: '',
    });
    setAmendmentErrors({});
  };

  const totalBilled = related?.summary?.totalBilled || 0;
  const woAmount = workOrder.workOrderAmount || 0;
  const billingProgress = related?.summary?.billingProgressPercent || (woAmount > 0 ? Math.min(100, Math.round((totalBilled / woAmount) * 100)) : 0);
  const remainingAmount = related?.summary?.remainingAmount ?? Math.max(0, woAmount - totalBilled);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Work Order: ${workOrder.workOrderNumber}`}
      subtitle={`Tender Ref: ${workOrder.tenderNumber} | Financial Year: FY ${workOrder.financialYear}`}
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Sanction Ref: <span className="font-mono font-semibold text-slate-800">{workOrder.workOrderNumber}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
            <Button
              variant="navy"
              icon={Printer}
              onClick={() =>
                printElement('printable-document', {
                  title: `WorkOrder_${workOrder.workOrderNumber?.replace(/[\/\\]/g, '_') || 'Sanction'}`,
                })
              }
              className="w-full sm:w-auto shadow-sm text-xs"
            >
              Print / Save PDF Sanction
            </Button>
            {onEdit && (
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  onEdit(workOrder);
                }}
                className="w-full sm:w-auto shadow-sm text-xs"
              >
                Edit Work Order
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 sm:space-y-5 no-print">
        {/* Title Banner */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Project Description
            </span>
            <Badge variant={workOrder.status}>{workOrder.status}</Badge>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            {workOrder.title || 'Project Infrastructure Work Order'}
          </h3>
          <div className="mt-2 text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-700">Contractor / Agency:</span>
            <span className="text-blue-700 font-medium">
              {workOrder.contractorName || 'Contractor / Agency'}
            </span>
          </div>
        </div>

        {/* Tab Navigation - Scrollable on mobile */}
        <div className="flex border-b border-slate-200 text-xs overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Core Specifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('related')}
            className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'related'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Related Records & Workflow
            {related && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                {(related.agreements?.length || 0) + (related.billingRecords?.length || 0) + (related.fmdRecords?.length || 0)}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('amendments')}
            className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'amendments'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Amendments & Baseline
            {amendments.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                {amendments.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Core Field Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
              <div className="p-3 border rounded-lg bg-white">
                <span className="text-slate-400 block mb-0.5">Tender Number</span>
                <span className="font-mono font-bold text-slate-900">{workOrder.tenderNumber}</span>
              </div>

              <div className="p-3 border rounded-lg bg-white">
                <span className="text-slate-400 block mb-0.5">Work Order Number</span>
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
            <div className="p-3.5 sm:p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <IndianRupee className="h-4 w-4 text-blue-700" />
                Financial & Deposit Provisions
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
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
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-slate-600">Stipulated Date of Completion:</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(workOrder.stipulatedDateOfCompletion)}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Authenticated Record</span>
            </div>
          </div>
        )}

        {activeTab === 'related' && (
          <div className="space-y-4">
            {/* Financial Progress & Execution Summary */}
            <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Financial Realization & Billing Progress
                </span>
                <span className="font-bold text-blue-700 font-mono">
                  {billingProgress}% Disbursed
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, billingProgress))}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-slate-400 block">Sanctioned WO:</span>
                  <span className="font-bold text-slate-800 font-mono">{formatCurrency(woAmount)}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-slate-400 block">Total Billed:</span>
                  <span className="font-bold text-emerald-700 font-mono">{formatCurrency(totalBilled)}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-slate-400 block">Unbilled Balance:</span>
                  <span className="font-bold text-slate-600 font-mono">{formatCurrency(remainingAmount)}</span>
                </div>
              </div>
            </div>

            {loadingRelated && (
              <div className="text-center py-6 text-xs text-slate-500">
                Fetching linked agreements, billing vouchers & security records...
              </div>
            )}

            {!loadingRelated && (
              <div className="space-y-4 text-xs">
                {/* 1. Related Agreements */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                    <FileSignature className="h-3.5 w-3.5 text-blue-600" />
                    Legal Agreements ({related?.agreements?.length || 0})
                  </h4>

                  {related?.agreements?.length > 0 ? (
                    <div className="space-y-1.5">
                      {related.agreements.map((agr) => (
                        <div
                          key={agr._id || agr.id}
                          className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold font-mono text-blue-700 block">
                              {agr.agreementNumber}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {agr.templateType || 'Standard Contract'} • {formatDate(agr.agreementDate)}
                            </span>
                          </div>
                          <Badge variant={agr.status}>{agr.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic p-2 bg-slate-50 rounded border border-dashed">
                      No legal agreement bound to this Work Order yet.
                    </p>
                  )}
                </div>

                {/* 2. Related Billing Vouchers */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                    <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                    Billing Records & RA Vouchers ({related?.billingRecords?.length || 0})
                  </h4>

                  {related?.billingRecords?.length > 0 ? (
                    <div className="space-y-1.5">
                      {related.billingRecords.map((bill) => (
                        <div
                          key={bill._id || bill.id}
                          className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold font-mono text-slate-900 block">
                              {bill.invoiceNumber}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Gross: {formatCurrency(bill.totalAmount || bill.amount)} • Net: {formatCurrency(bill.netPayable || bill.amount)} • {formatDate(bill.invoiceDate)}
                            </span>
                          </div>
                          <Badge variant={bill.status}>{bill.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic p-2 bg-slate-50 rounded border border-dashed">
                      No billing records submitted against this Work Order yet.
                    </p>
                  )}
                </div>

                {/* 3. Related FMD / SD Security */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                    Security Deposit & FMD Records ({related?.fmdRecords?.length || 0})
                  </h4>

                  {related?.fmdRecords?.length > 0 ? (
                    <div className="space-y-1.5">
                      {related.fmdRecords.map((fmd) => (
                        <div
                          key={fmd._id || fmd.id}
                          className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold font-mono text-purple-900 block">
                              Tender: {fmd.tenderNumber}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              SD: {formatCurrency(fmd.sdAmount)} • {fmd.instrumentType || 'Bank Guarantee'}
                            </span>
                          </div>
                          <Badge variant={fmd.fmdStatus}>{fmd.fmdStatus}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic p-2 bg-slate-50 rounded border border-dashed">
                      No security deposit record linked to this Work Order.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'amendments' && (
          <div className="space-y-4">
            {/* Preserved Historical Baseline Valuation */}
            <div className="p-3.5 sm:p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-blue-700" />
                  Preserved Contractual Baseline (Immutable History)
                </h4>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                  Sanction Protected
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded bg-white border border-blue-100">
                  <span className="text-slate-400 block mb-0.5">Original Sanctioned Amount</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {formatCurrency(baseline.originalSanctionedAmount)}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-white border border-blue-100">
                  <span className="text-slate-400 block mb-0.5">Original Completion Date</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(baseline.originalStipulatedCompletionDate)}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-white border border-blue-100">
                  <span className="text-slate-400 block mb-0.5">Active Contract Amount</span>
                  <span className="font-bold text-blue-700 font-mono text-sm">
                    {formatCurrency(workOrder.workOrderAmount)}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-white border border-blue-100">
                  <span className="text-slate-400 block mb-0.5">Recorded Amendments</span>
                  <span className="font-bold text-slate-800">
                    {amendments.length} Proposed
                  </span>
                </div>
              </div>
            </div>

            {/* Departmental Confirmation Notice */}
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-300 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-900 block font-semibold">
                  Approval Required for Baseline Contract Revisions
                </strong>
                <span className="text-amber-800 text-[11px]">
                  All scope variations, rate revisions, and time extension amendments remain safely in 'Pending Approval' status. The baseline contract values are preserved until formal approval is confirmed.
                </span>
              </div>
            </div>

            {/* Proposed Amendment Form (Collapsible) */}
            {isAddingAmendment ? (
              <form onSubmit={handleCreateAmendment} className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                    Draft Proposed Scope / Time Amendment
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingAmendment(false);
                      setAmendmentErrors({});
                    }}
                  >
                    Cancel
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Input
                    label="Proposal Reference Dispatch No."
                    name="referenceNumber"
                    value={amendmentForm.referenceNumber}
                    onChange={(e) => setAmendmentForm({ ...amendmentForm, referenceNumber: e.target.value })}
                    required
                    error={amendmentErrors.referenceNumber}
                    placeholder="e.g. REV-2026-088"
                  />

                  <Input
                    label="Proposal Submission Date"
                    name="amendmentDate"
                    type="date"
                    value={amendmentForm.amendmentDate}
                    onChange={(e) => setAmendmentForm({ ...amendmentForm, amendmentDate: e.target.value })}
                    required
                    error={amendmentErrors.amendmentDate}
                  />

                  <Input
                    label="Proposed Revised Amount"
                    name="proposedAmount"
                    type="number"
                    prefix="₹"
                    placeholder={String(workOrder.workOrderAmount || '')}
                    value={amendmentForm.proposedAmount}
                    onChange={(e) => setAmendmentForm({ ...amendmentForm, proposedAmount: e.target.value })}
                    helperText="Baseline amount is preserved"
                  />

                  <Input
                    label="Proposed Completion Date"
                    name="proposedCompletionDate"
                    type="date"
                    value={amendmentForm.proposedCompletionDate}
                    onChange={(e) => setAmendmentForm({ ...amendmentForm, proposedCompletionDate: e.target.value })}
                  />

                  <Input
                    label="Time Extension (Days)"
                    name="timeExtensionDays"
                    type="number"
                    placeholder="e.g. 60"
                    value={amendmentForm.timeExtensionDays}
                    onChange={(e) => setAmendmentForm({ ...amendmentForm, timeExtensionDays: e.target.value })}
                  />

                  <Input
                    label="Submitting Authority / Project Team"
                    name="submittedBy"
                    value={amendmentForm.submittedBy}
                    onChange={(e) => setAmendmentForm({ ...amendmentForm, submittedBy: e.target.value })}
                    placeholder="e.g. Operations Director / Project Manager"
                  />
                </div>

                <Input
                  label="Justification & Technical Scope Reason"
                  name="reason"
                  value={amendmentForm.reason}
                  onChange={(e) => setAmendmentForm({ ...amendmentForm, reason: e.target.value })}
                  required
                  error={amendmentErrors.reason}
                  placeholder="e.g. Additional foundation depth required due to flood strata inspection"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setIsAddingAmendment(false);
                      setAmendmentErrors({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" variant="primary" type="submit">
                    Record Proposed Amendment
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  icon={Plus}
                  onClick={() => setIsAddingAmendment(true)}
                  className="text-xs"
                >
                  Propose Work Order Amendment
                </Button>
              </div>
            )}

            {/* List of Historical Amendments */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Amendment History ({amendments.length})
              </h4>

              {amendments.map((amd, idx) => (
                <div key={amd.id || idx} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono">{amd.amendmentNumber}</span>
                      <span className="text-slate-500 font-mono text-[11px]">Ref: {amd.referenceNumber}</span>
                      <span className="text-slate-400 text-[11px]">• {formatDate(amd.amendmentDate)}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 w-fit">
                      {amd.status?.replace('Departmental ', '') || 'Pending Approval'}
                    </span>
                  </div>

                  <p className="text-slate-700 text-xs">
                    <strong className="text-slate-900">Justification: </strong>
                    {amd.reason}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                    <div className="p-2 rounded bg-slate-50 border">
                      <span className="text-slate-400 block">Proposed Revised Amount:</span>
                      <strong className="text-slate-900 font-mono">{formatCurrency(amd.proposedAmount)}</strong>
                      {amd.amountVariation !== 0 && (
                        <span className={`text-[10px] ml-1 font-semibold ${amd.amountVariation > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          ({amd.amountVariation > 0 ? `+${formatCurrency(amd.amountVariation)}` : formatCurrency(amd.amountVariation)})
                        </span>
                      )}
                    </div>
                    <div className="p-2 rounded bg-slate-50 border">
                      <span className="text-slate-400 block">Proposed Completion:</span>
                      <strong className="text-slate-900">{formatDate(amd.proposedCompletionDate)}</strong>
                      {amd.timeExtensionDays > 0 && (
                        <span className="text-[10px] text-blue-700 ml-1 font-semibold">
                          (+{amd.timeExtensionDays} days)
                        </span>
                      )}
                    </div>
                    <div className="p-2 rounded bg-slate-50 border">
                      <span className="text-slate-400 block">Submitting Authority:</span>
                      <strong className="text-slate-800">{amd.submittedBy || 'Executive Engineer'}</strong>
                    </div>
                  </div>
                </div>
              ))}

              {amendments.length === 0 && (
                <div className="p-6 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500 bg-slate-50/50">
                  No revisions or scope amendments recorded for this Work Order. Original baseline specifications remain active.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Printable Official PWD Work Order Sanction Sheet for offline PDF generation */}
      <div id="printable-document" className="hidden print:block bg-white p-6 font-sans text-slate-900 space-y-4 max-w-3xl mx-auto">
        <div className="text-center border-b-2 border-slate-900 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">
            CONTRACT & INFRASTRUCTURE PROJECT MANAGEMENT ENTERPRISE
          </h2>
          <h3 className="text-sm font-extrabold uppercase mt-0.5">
            PROJECT OPERATIONS & CONTRACT ADMINISTRATION
          </h3>
          <p className="text-xs font-semibold text-slate-800">
            SANCTIONED WORK ORDER & PROJECT SPECIFICATION DOCUMENT
          </p>
          <div className="flex justify-center gap-4 text-[10px] text-slate-500 mt-1 font-mono">
            <span>WO Ref: {workOrder.workOrderNumber}</span>
            <span>•</span>
            <span>Tender Ref: {workOrder.tenderNumber}</span>
            <span>•</span>
            <span>FY: {workOrder.financialYear}</span>
          </div>
        </div>

        <div className="border p-3 rounded bg-slate-50 text-xs grid grid-cols-2 gap-2">
          <div><span className="font-semibold text-slate-600 block">Project / Work Title:</span><span className="font-bold text-slate-900">{workOrder.title}</span></div>
          <div><span className="font-semibold text-slate-600 block">Awarded Contractor:</span><span className="font-bold text-slate-900">{workOrder.contractorName}</span></div>
          <div><span className="font-semibold text-slate-600 block">Work Order Date:</span><span className="font-bold text-slate-900">{formatDate(workOrder.workOrderDate)}</span></div>
          <div><span className="font-semibold text-slate-600 block">Stipulated Completion:</span><span className="font-bold text-slate-900">{formatDate(workOrder.stipulatedDateOfCompletion)}</span></div>
          <div><span className="font-semibold text-slate-600 block">TD (Preserved Field):</span><span className="font-mono text-slate-900">{workOrder.td || '-'}</span></div>
          <div><span className="font-semibold text-slate-600 block">Estimate Number:</span><span className="font-mono text-slate-900">{workOrder.estimateNumber || '-'}</span></div>
          <div><span className="font-semibold text-slate-600 block">Subdivision Association:</span><span className="text-slate-900">{workOrder.subdivisionName || 'Division General'}</span></div>
          <div><span className="font-semibold text-slate-600 block">Execution Status:</span><span className="font-bold text-slate-900">{workOrder.status}</span></div>
        </div>

        <div className="border p-3 rounded bg-white text-xs">
          <h4 className="font-bold uppercase text-slate-800 mb-2">Financial Valuation & Statutory Provisions</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-slate-50 rounded"><span className="text-slate-500 text-[10px] block">Sanctioned WO Value</span><span className="font-bold text-slate-900">{formatCurrency(workOrder.workOrderAmount)}</span></div>
            <div className="p-2 bg-slate-50 rounded"><span className="text-slate-500 text-[10px] block">Earnest Money (EMD)</span><span className="font-bold text-slate-900">{formatCurrency(workOrder.emdAmount)}</span></div>
            <div className="p-2 bg-slate-50 rounded"><span className="text-slate-500 text-[10px] block">Security Deposit (SD)</span><span className="font-bold text-slate-900">{formatCurrency(workOrder.sdAmount)}</span></div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
          <div>
            <p className="text-slate-500 font-medium">Reconciled by:</p>
            <div className="mt-8 border-t border-slate-400 w-44 mb-1"></div>
            <p className="font-bold text-slate-900">Finance & Accounts Manager</p>
            <p className="text-slate-500 text-[11px]">Finance & Project Accounts</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="text-slate-500 font-medium">Approved & Authorized by:</p>
            <div className="mt-8 border-t border-slate-400 w-44 mb-1 sm:ml-auto"></div>
            <p className="font-bold text-slate-900">Operations Director / Project Head</p>
            <p className="text-slate-500 text-[11px]">Contract & Execution Division</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

