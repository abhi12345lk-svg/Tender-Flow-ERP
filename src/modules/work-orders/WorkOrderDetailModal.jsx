import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { api } from '../../services/apiClient';
import { dataService } from '../../services/dataService';
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
              onClick={() => window.print()}
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
            {workOrder.title || 'Government Infrastructure Work Order'}
          </h3>
          <div className="mt-2 text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-700">Contractor / Agency:</span>
            <span className="text-blue-700 font-medium">
              {workOrder.contractorName || 'Registered PWD Vendor'}
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
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Core Field Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
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
      </div>

      {/* Printable Official PWD Work Order Sanction Sheet for offline PDF generation */}
      <div id="printable-document" className="hidden print:block bg-white p-6 font-sans text-slate-900 space-y-4 max-w-3xl mx-auto">
        <div className="text-center border-b-2 border-slate-900 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">
            GOVERNMENT OF STATE / सरकारी लोक निर्माण विभाग
          </h2>
          <h3 className="text-sm font-extrabold uppercase mt-0.5">
            OFFICE OF THE EXECUTIVE ENGINEER, DIVISION NO. 1
          </h3>
          <p className="text-xs font-semibold text-slate-800">
            SANCTIONED WORK ORDER & STATUTORY SPECIFICATION ORDER
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
            <p className="font-bold text-slate-900">Divisional Accountant (DA)</p>
            <p className="text-slate-500 text-[11px]">Accounts Branch, Division 1</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="text-slate-500 font-medium">Sanctioned & Issued by:</p>
            <div className="mt-8 border-t border-slate-400 w-44 mb-1 sm:ml-auto"></div>
            <p className="font-bold text-slate-900">Executive Engineer</p>
            <p className="text-slate-500 text-[11px]">Public Works Division No. 1</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

