import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import { useApp } from '../../context/AppContext';
import { validateSdReleaseGate, DEFAULT_SD_RELEASE_CONFIG } from '../../services/fmd/sdReleaseGate';
import { ShieldCheck, AlertCircle, FileCheck, CheckCircle2 } from 'lucide-react';

export default function FmdSdModal({ isOpen, onClose, onSave, editingItem }) {
  const { workOrders } = useApp();

  const [formData, setFormData] = useState({
    tenderNumber: '',
    tenderTitle: '',
    workOrderId: '',
    workOrderNumber: '',
    contractorName: '',
    fmdStatus: 'Verified & Retained',
    sdAmount: '',
    emdAmount: '',
    instrumentType: 'Bank Guarantee (FDR / BG)',
    bankName: '',
    instrumentReference: '',
    validityDate: '',
    uploadedDocuments: [],
    // SD Release Clearance Gate fields
    releaseOrderNumber: '',
    releaseApprovalDate: '',
    releaseApprovingAuthority: '',
    dlpClearanceStatus: false,
    finalBillPassed: false,
    noDuesCertificate: false,
    releaseRemarks: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingItem) {
      setFormData({
        tenderNumber: editingItem.tenderNumber || '',
        tenderTitle: editingItem.tenderTitle || '',
        workOrderId: editingItem.workOrderId || '',
        workOrderNumber: editingItem.workOrderNumber || '',
        contractorName: editingItem.contractorName || '',
        fmdStatus: editingItem.fmdStatus || 'Verified & Retained',
        sdAmount: editingItem.sdAmount ?? '',
        emdAmount: editingItem.emdAmount ?? '',
        instrumentType: editingItem.instrumentType || 'Bank Guarantee (FDR / BG)',
        bankName: editingItem.bankName || '',
        instrumentReference: editingItem.instrumentReference || '',
        validityDate: editingItem.validityDate || '',
        uploadedDocuments: editingItem.uploadedDocuments || [],
        releaseOrderNumber: editingItem.releaseOrderNumber || '',
        releaseApprovalDate: editingItem.releaseApprovalDate || '',
        releaseApprovingAuthority: editingItem.releaseApprovingAuthority || '',
        dlpClearanceStatus: Boolean(editingItem.dlpClearanceStatus),
        finalBillPassed: Boolean(editingItem.finalBillPassed),
        noDuesCertificate: Boolean(editingItem.noDuesCertificate),
        releaseRemarks: editingItem.releaseRemarks || '',
      });
    } else {
      const defaultWo = workOrders[0];
      setFormData({
        tenderNumber: defaultWo?.tenderNumber || '',
        tenderTitle: defaultWo?.title || '',
        workOrderId: defaultWo?.id || '',
        workOrderNumber: defaultWo?.workOrderNumber || '',
        contractorName: defaultWo?.contractorName || '',
        fmdStatus: 'Verified & Retained',
        sdAmount: defaultWo?.sdAmount ?? '',
        emdAmount: defaultWo?.emdAmount ?? '',
        instrumentType: 'Bank Guarantee (FDR / BG)',
        bankName: 'State Bank of India',
        instrumentReference: 'BG-SBI-' + Math.floor(1000 + Math.random() * 9000),
        validityDate: '2026-03-31',
        uploadedDocuments: [],
        releaseOrderNumber: '',
        releaseApprovalDate: '',
        releaseApprovingAuthority: '',
        dlpClearanceStatus: false,
        finalBillPassed: false,
        noDuesCertificate: false,
        releaseRemarks: '',
      });
    }
    setErrors({});
  }, [editingItem, isOpen, workOrders]);

  const handleWorkOrderSelect = (e) => {
    const selectedId = e.target.value;
    const wo = workOrders.find((w) => w.id === selectedId || w._id === selectedId);
    if (wo) {
      setFormData((prev) => ({
        ...prev,
        workOrderId: wo._id || wo.id,
        workOrderNumber: wo.workOrderNumber,
        tenderNumber: wo.tenderNumber,
        tenderTitle: wo.title,
        contractorName: wo.contractorName || '',
        sdAmount: wo.sdAmount || prev.sdAmount,
        emdAmount: wo.emdAmount || prev.emdAmount,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        workOrderId: '',
        workOrderNumber: '',
      }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.tenderNumber.trim()) {
      errs.tenderNumber = 'Tender Number is mandatory';
    }
    if (!formData.tenderTitle.trim()) {
      errs.tenderTitle = 'Tender Details / Title are required';
    }

    // SD Release Clearance Gate enforcement
    const releaseValidation = validateSdReleaseGate(formData);
    if (!releaseValidation.allowed) {
      Object.assign(errs, releaseValidation.errors);
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...formData,
      sdAmount: Number(formData.sdAmount) || 0,
      emdAmount: Number(formData.emdAmount) || 0,
    });
    onClose();
  };

  const handleStatusChange = (val) => {
    if (val === 'Released') {
      setFormData((prev) => ({
        ...prev,
        fmdStatus: val,
        releaseOrderNumber: prev.releaseOrderNumber || `REL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        releaseApprovalDate: prev.releaseApprovalDate || new Date().toISOString().split('T')[0],
        releaseApprovingAuthority: prev.releaseApprovingAuthority || 'Operations Director',
        dlpClearanceStatus: prev.dlpClearanceStatus !== undefined ? prev.dlpClearanceStatus : true,
      }));
    } else {
      setFormData((prev) => ({ ...prev, fmdStatus: val }));
    }
  };

  const isReleasedStatus = formData.fmdStatus === 'Released';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit FMD / SD Record' : 'Register FMD / SD Security'}
      subtitle="Keep FMD as FMD. Track Security Deposit instruments and tender custody"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} className="w-full sm:w-auto shadow-sm">
            {editingItem ? 'Save Changes' : 'Register FMD / SD'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Related Work Order Selector */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Related Work Order Reference (Optional Link)
          </label>
          <select
            value={formData.workOrderId}
            onChange={handleWorkOrderSelect}
            className="block w-full rounded-md border border-slate-300 text-base sm:text-xs py-2 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 min-h-[40px] sm:min-h-0 cursor-pointer"
          >
            <option value="">-- Direct Tender (No Work Order Linked) --</option>
            {workOrders.map((wo) => (
              <option key={wo.id} value={wo.id}>
                {wo.workOrderNumber} | Tender: {wo.tenderNumber} - {wo.title || 'Work'}
              </option>
            ))}
          </select>
        </div>

        {/* Tender Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <Input
            label="Tender Number"
            name="tenderNumber"
            value={formData.tenderNumber}
            onChange={(e) => setFormData({ ...formData, tenderNumber: e.target.value })}
            required
            error={errors.tenderNumber}
            placeholder="e.g. TN-2024-892"
          />

          <Input
            label="Contractor / Bidder Name"
            name="contractorName"
            value={formData.contractorName}
            onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
            placeholder="e.g. M/s Infra Buildcon India Ltd."
          />
        </div>

        <Input
          label="Tender Title / Works Scope"
          name="tenderTitle"
          value={formData.tenderTitle}
          onChange={(e) => setFormData({ ...formData, tenderTitle: e.target.value })}
          required
          error={errors.tenderTitle}
          placeholder="e.g. Construction of High-Level RCC Bridge across Ken Canal"
        />

        {/* Financial Security Amounts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <Input
            label="SD Amount (Security Deposit)"
            name="sdAmount"
            type="number"
            prefix="₹"
            value={formData.sdAmount}
            onChange={(e) => setFormData({ ...formData, sdAmount: e.target.value })}
          />

          <Input
            label="EMD Amount"
            name="emdAmount"
            type="number"
            prefix="₹"
            value={formData.emdAmount}
            onChange={(e) => setFormData({ ...formData, emdAmount: e.target.value })}
          />

          <Select
            label="FMD Status"
            name="fmdStatus"
            value={formData.fmdStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            options={[
              { value: 'Verified & Retained', label: 'Verified & Retained' },
              { value: 'Under Scrutiny', label: 'Under Scrutiny' },
              { value: 'Pending Bank Confirmation', label: 'Pending Bank Confirmation' },
              { value: 'Released', label: 'Released / Discharged' },
              { value: 'Forfeited', label: 'Forfeited' },
            ]}
          />
        </div>

        {/* Instrument Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <Select
            label="Instrument Type"
            name="instrumentType"
            value={formData.instrumentType}
            onChange={(e) => setFormData({ ...formData, instrumentType: e.target.value })}
            options={[
              { value: 'Bank Guarantee (FDR / BG)', label: 'Bank Guarantee (BG)' },
              { value: 'Fixed Deposit Receipt (FDR)', label: 'Fixed Deposit Receipt (FDR)' },
              { value: 'Treasury Challan / Deposit', label: 'Treasury Challan' },
              { value: 'National Savings Certificate (NSC)', label: 'National Savings Certificate (NSC)' },
            ]}
          />

          <Input
            label="Issuing Bank / Authority"
            name="bankName"
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            placeholder="e.g. State Bank of India"
          />

          <Input
            label="Instrument Reference / BG No."
            name="instrumentReference"
            value={formData.instrumentReference}
            onChange={(e) => setFormData({ ...formData, instrumentReference: e.target.value })}
            placeholder="e.g. BG-SBI-ND-2024-0994"
          />
        </div>

        <Input
          label="Instrument Validity Upto"
          name="validityDate"
          type="date"
          value={formData.validityDate}
          onChange={(e) => setFormData({ ...formData, validityDate: e.target.value })}
          helperText="Bank Guarantee or deposit validity expiry date"
        />

        {/* SD RELEASE & SETTLEMENT DOCUMENTATION PANEL */}
        {isReleasedStatus && (
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3.5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Security Release & Settlement Documentation
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Record release reference details and project completion warranty sign-off for audit tracking.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Input
                label="Release Reference / Order Number"
                name="releaseOrderNumber"
                value={formData.releaseOrderNumber}
                onChange={(e) => setFormData({ ...formData, releaseOrderNumber: e.target.value })}
                required
                error={errors.releaseOrderNumber}
                placeholder="e.g. REL-2026-042"
              />

              <Input
                label="Settlement Approval Date"
                name="releaseApprovalDate"
                type="date"
                value={formData.releaseApprovalDate}
                onChange={(e) => setFormData({ ...formData, releaseApprovalDate: e.target.value })}
                required
                error={errors.releaseApprovalDate}
              />

              <Input
                label="Approving Manager / Officer"
                name="releaseApprovingAuthority"
                value={formData.releaseApprovingAuthority}
                onChange={(e) => setFormData({ ...formData, releaseApprovingAuthority: e.target.value })}
                required
                error={errors.releaseApprovingAuthority}
                placeholder="e.g. Operations Director / Project Manager"
              />
            </div>

            {/* Checklist Checkboxes */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                Settlement Verification Checklist
              </span>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.dlpClearanceStatus}
                  onChange={(e) => setFormData({ ...formData, dlpClearanceStatus: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="font-semibold text-slate-900">
                  Defect Liability Period / Warranty Cleared <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] text-slate-500">(Maintenance warranty expired without defect)</span>
              </label>
              {errors.dlpClearanceStatus && (
                <p className="text-xs text-rose-600 ml-6">{errors.dlpClearanceStatus}</p>
              )}

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.finalBillPassed}
                  onChange={(e) => setFormData({ ...formData, finalBillPassed: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span>Final Account / Bill Passed and all project recoveries reconciled</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.noDuesCertificate}
                  onChange={(e) => setFormData({ ...formData, noDuesCertificate: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span>No Demand / No Dues Certificate on Record from Contractor</span>
              </label>
            </div>

            <Input
              label="Release Clearance Remarks / Dispatch Notes"
              name="releaseRemarks"
              value={formData.releaseRemarks}
              onChange={(e) => setFormData({ ...formData, releaseRemarks: e.target.value })}
              placeholder="e.g. Sanctioned vide Divisional Order No. 421; bank guarantee discharged"
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
