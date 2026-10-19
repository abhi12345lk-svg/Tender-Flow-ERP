import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import { useApp } from '../../context/AppContext';

export default function AgreementModal({ isOpen, onClose, onSave, editingAgreement }) {
  const { workOrders } = useApp();

  const [formData, setFormData] = useState({
    agreementNumber: '',
    workOrderId: '',
    workOrderNumber: '',
    tenderNumber: '',
    contractorName: '',
    templateType: 'Standard PWD Contract Form F-2 (Lump Sum)',
    agreementDate: new Date().toISOString().split('T')[0],
    stampDutyNumber: '',
    stampDutyAmount: '',
    status: 'Active',
    clausesCount: 36,
    documentTitle: '',
    content: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingAgreement) {
      setFormData({
        agreementNumber: editingAgreement.agreementNumber || '',
        workOrderId: editingAgreement.workOrderId || '',
        workOrderNumber: editingAgreement.workOrderNumber || '',
        tenderNumber: editingAgreement.tenderNumber || '',
        contractorName: editingAgreement.contractorName || '',
        templateType: editingAgreement.templateType || 'Standard PWD Contract Form F-2 (Lump Sum)',
        agreementDate: editingAgreement.agreementDate || '',
        stampDutyNumber: editingAgreement.stampDutyNumber || '',
        stampDutyAmount: editingAgreement.stampDutyAmount ?? '',
        status: editingAgreement.status || 'Active',
        clausesCount: editingAgreement.clausesCount || 36,
        documentTitle: editingAgreement.documentTitle || '',
        content: editingAgreement.content || '',
      });
    } else {
      const defaultWo = workOrders[0];
      setFormData({
        agreementNumber: `AGR/PWD/2024/${Math.floor(100 + Math.random() * 900)}`,
        workOrderId: defaultWo?.id || '',
        workOrderNumber: defaultWo?.workOrderNumber || '',
        tenderNumber: defaultWo?.tenderNumber || '',
        contractorName: defaultWo?.contractorName || '',
        templateType: 'Standard PWD Contract Form F-2 (Lump Sum)',
        agreementDate: new Date().toISOString().split('T')[0],
        stampDutyNumber: 'E-STAMP-DL24-' + Math.floor(100000 + Math.random() * 900000),
        stampDutyAmount: 15000,
        status: 'Active',
        clausesCount: 40,
        documentTitle: defaultWo ? `Agreement for ${defaultWo.title}` : '',
        content: `MEMORANDUM OF AGREEMENT between Public Works Department and Contractor for execution of works in accordance with sanctioned specifications.`,
      });
    }
    setErrors({});
  }, [editingAgreement, isOpen, workOrders]);

  const handleWorkOrderSelect = (e) => {
    const selectedId = e.target.value;
    const wo = workOrders.find((w) => w.id === selectedId || w._id === selectedId);
    if (wo) {
      setFormData((prev) => ({
        ...prev,
        workOrderId: wo._id || wo.id,
        workOrderNumber: wo.workOrderNumber,
        tenderNumber: wo.tenderNumber,
        contractorName: wo.contractorName || 'Registered Agency',
        documentTitle: `Agreement for ${wo.title || wo.workOrderNumber}`,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        workOrderId: '',
        workOrderNumber: '',
        tenderNumber: '',
        contractorName: '',
      }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.agreementNumber.trim()) {
      errs.agreementNumber = 'Agreement Number is required';
    }
    if (!formData.workOrderId) {
      errs.workOrderId = 'Please select a related Work Order';
    }
    if (!formData.agreementDate) {
      errs.agreementDate = 'Agreement Date is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...formData,
      stampDutyAmount: Number(formData.stampDutyAmount) || 0,
      clausesCount: Number(formData.clausesCount) || 1,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAgreement ? 'Edit Agreement' : 'New Contract Agreement'}
      subtitle="Link related work order, assign legal template, and configure contract clauses"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} className="w-full sm:w-auto shadow-sm">
            {editingAgreement ? 'Save Changes' : 'Execute Agreement'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Related Work Order Selector */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Select Related Work Order <span className="text-rose-500">*</span>
          </label>
          <select
            value={formData.workOrderId}
            onChange={handleWorkOrderSelect}
            className={`block w-full rounded-md border text-base sm:text-xs py-2 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 min-h-[40px] sm:min-h-0 cursor-pointer ${
              errors.workOrderId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
            }`}
          >
            <option value="">-- Choose Work Order to Bind Agreement --</option>
            {workOrders.map((wo) => (
              <option key={wo.id} value={wo.id}>
                {wo.workOrderNumber} | Tender: {wo.tenderNumber} - {wo.title || 'Work'}
              </option>
            ))}
          </select>
          {errors.workOrderId && <p className="mt-1 text-xs text-rose-600">{errors.workOrderId}</p>}

          {formData.workOrderId && (
            <div className="mt-2.5 pt-2 border-t border-slate-200 text-xs flex flex-wrap gap-4 text-slate-600">
              <div>
                <span className="font-semibold text-slate-700">Contractor: </span>
                <span className="text-slate-900">{formData.contractorName}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Tender Number (M): </span>
                <span className="font-mono text-slate-900">{formData.tenderNumber}</span>
              </div>
            </div>
          )}
        </div>

        {/* Agreement No, Template and Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <Input
            label="Agreement Number"
            name="agreementNumber"
            value={formData.agreementNumber}
            onChange={(e) => setFormData({ ...formData, agreementNumber: e.target.value })}
            required
            error={errors.agreementNumber}
            helperText="Legal agreement identifier"
          />

          <Select
            label="Contract Template Form"
            name="templateType"
            value={formData.templateType}
            onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
            options={[
              { value: 'Standard PWD Contract Form F-2 (Lump Sum)', label: 'Standard PWD Form F-2 (Lump Sum)' },
              { value: 'Item Rate Agreement Form B-1', label: 'Item Rate Agreement Form B-1' },
              { value: 'EPC Turnkey Contract Template', label: 'EPC Turnkey Contract Template' },
              { value: 'Minor Repair & Maintenance Agreement', label: 'Minor Maintenance Agreement' },
            ]}
          />

          <Input
            label="Agreement Execution Date"
            name="agreementDate"
            type="date"
            value={formData.agreementDate}
            onChange={(e) => setFormData({ ...formData, agreementDate: e.target.value })}
            required
            error={errors.agreementDate}
          />
        </div>

        {/* Stamp Duty & Document Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <Input
            label="E-Stamp Duty Certificate No."
            name="stampDutyNumber"
            value={formData.stampDutyNumber}
            onChange={(e) => setFormData({ ...formData, stampDutyNumber: e.target.value })}
            placeholder="e.g. E-STAMP-DL24-998812"
          />

          <Input
            label="Stamp Duty Amount"
            name="stampDutyAmount"
            type="number"
            prefix="₹"
            value={formData.stampDutyAmount}
            onChange={(e) => setFormData({ ...formData, stampDutyAmount: e.target.value })}
          />

          <Select
            label="Agreement Status"
            name="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'Active', label: 'Active (Legally Enforceable)' },
              { value: 'Draft', label: 'Draft (Under Vetting)' },
              { value: 'Executed', label: 'Executed (Fully Signed)' },
              { value: 'Closed', label: 'Closed / Discharged' },
            ]}
          />
        </div>

        {/* Document Editing / Formatting Entry Point */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Document Text & Clauses Entry Point
            </label>
            <span className="text-[11px] text-slate-500">Editable Contract Clauses</span>
          </div>
          <textarea
            rows={5}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Enter standard clauses, terms of execution, penalty covenants..."
            className="block w-full rounded-md border border-slate-300 text-xs p-3 font-mono leading-relaxed focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
          />
        </div>
      </form>
    </Modal>
  );
}
