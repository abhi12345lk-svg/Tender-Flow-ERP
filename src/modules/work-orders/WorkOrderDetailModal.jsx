import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { api } from '../../services/apiClient';
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
} from 'lucide-react';

export default function WorkOrderDetailModal({ isOpen, onClose, workOrder, onEdit }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [related, setRelated] = useState(null);
  const [loadingRelated, setLoadingRelated] = useState(false);

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
        const res = await api.workOrders.getById(woId);
        if (res?.data?.related) {
          setRelated(res.data.related);
        }
      } catch (err) {
        console.warn('Could not load related records from backend:', err.message);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelated();
  }, [isOpen, workOrder]);

  if (!workOrder) return null;

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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
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
            className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
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
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
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
              <span className="text-[11px] text-slate-400">Authenticated Record</span>
            </div>
          </div>
        )}

        {activeTab === 'related' && (
          <div className="space-y-4">
            {/* Financial Progress & Execution Summary */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
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

              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-400 block">Sanctioned WO:</span>
                  <span className="font-bold text-slate-800 font-mono">{formatCurrency(woAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Billed:</span>
                  <span className="font-bold text-emerald-700 font-mono">{formatCurrency(totalBilled)}</span>
                </div>
                <div>
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
      </div>
    </Modal>
  );
}

