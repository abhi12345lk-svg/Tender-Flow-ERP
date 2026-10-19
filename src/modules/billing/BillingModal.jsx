import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import { useApp } from '../../context/AppContext';
import { calculateGST, calculateNetBilling, formatCurrency } from '../../utils/formatters';
import { Calculator, AlertCircle, Percent } from 'lucide-react';

export default function BillingModal({ isOpen, onClose, onSave, editingBilling }) {
  const { workOrders, subdivisions } = useApp();

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    workOrderId: '',
    workOrderNumber: '',
    tenderNumber: '',
    contractorName: '',
    subdivisionId: '',
    subdivisionName: '',
    dateOfCompletion: '',
    dateOfHandover: '',
    amount: '', // Basic amount
    gstRate: 18, // Configurable tax assumption
    status: 'Submitted',
    deductions: {
      sdAmount: '',
      tdsAmount: '',
      labourCess: '',
      royalty: '',
      penalty: '',
    },
    remarks: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingBilling) {
      setFormData({
        invoiceNumber: editingBilling.invoiceNumber || '',
        invoiceDate: editingBilling.invoiceDate || '',
        workOrderId: editingBilling.workOrderId || '',
        workOrderNumber: editingBilling.workOrderNumber || '',
        tenderNumber: editingBilling.tenderNumber || '',
        contractorName: editingBilling.contractorName || '',
        subdivisionId: editingBilling.subdivisionId || '',
        subdivisionName: editingBilling.subdivisionName || '',
        dateOfCompletion: editingBilling.dateOfCompletion || '',
        dateOfHandover: editingBilling.dateOfHandover || '',
        amount: editingBilling.amount ?? '',
        gstRate: editingBilling.gstRate ?? 18,
        status: editingBilling.status || 'Submitted',
        deductions: {
          sdAmount: editingBilling.deductions?.sdAmount ?? '',
          tdsAmount: editingBilling.deductions?.tdsAmount ?? '',
          labourCess: editingBilling.deductions?.labourCess ?? '',
          royalty: editingBilling.deductions?.royalty ?? '',
          penalty: editingBilling.deductions?.penalty ?? '',
        },
        remarks: editingBilling.remarks || '',
      });
    } else {
      const defaultWo = workOrders[0];
      setFormData({
        invoiceNumber: `RA-0${Math.floor(1 + Math.random() * 9)}/PWD/${new Date().getFullYear()}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        workOrderId: defaultWo?.id || '',
        workOrderNumber: defaultWo?.workOrderNumber || '',
        tenderNumber: defaultWo?.tenderNumber || '',
        contractorName: defaultWo?.contractorName || '',
        subdivisionId: defaultWo?.subdivisionId || subdivisions[0]?.id || '',
        subdivisionName: defaultWo?.subdivisionName || subdivisions[0]?.name || '',
        dateOfCompletion: '',
        dateOfHandover: '',
        amount: '',
        gstRate: 18,
        status: 'Submitted',
        deductions: {
          sdAmount: '',
          tdsAmount: '',
          labourCess: '',
          royalty: '',
          penalty: '',
        },
        remarks: '',
      });
    }
    setErrors({});
  }, [editingBilling, isOpen, workOrders, subdivisions]);

  const handleWorkOrderSelect = (e) => {
    const selectedId = e.target.value;
    const wo = workOrders.find((w) => w.id === selectedId);
    if (wo) {
      setFormData((prev) => ({
        ...prev,
        workOrderId: wo.id,
        workOrderNumber: wo.workOrderNumber,
        tenderNumber: wo.tenderNumber,
        contractorName: wo.contractorName || 'Registered Agency',
        subdivisionId: wo.subdivisionId || prev.subdivisionId,
        subdivisionName: wo.subdivisionName || prev.subdivisionName,
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

  const handleSubdivisionChange = (e) => {
    const subId = e.target.value;
    const found = subdivisions.find((s) => s.id === subId);
    setFormData((prev) => ({
      ...prev,
      subdivisionId: subId,
      subdivisionName: found ? found.name : '',
    }));
  };

  const handleDeductionChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      deductions: {
        ...prev.deductions,
        [key]: value,
      },
    }));
  };

  // Calculations
  const baseAmt = parseFloat(formData.amount) || 0;
  const gstCalculations = calculateGST(baseAmt, formData.gstRate);
  const netCalculations = calculateNetBilling(gstCalculations.totalAmount, formData.deductions);

  const validate = () => {
    const errs = {};
    if (!formData.invoiceNumber.trim()) {
      errs.invoiceNumber = 'Invoice Number is required';
    }
    if (!formData.invoiceDate) {
      errs.invoiceDate = 'Invoice Date is required';
    }
    if (!formData.workOrderId) {
      errs.workOrderId = 'Please select a related Work Order';
    }
    if (formData.amount === '' || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      errs.amount = 'Please enter a valid positive Bill Amount';
    }
    if (formData.gstRate === '' || isNaN(Number(formData.gstRate)) || Number(formData.gstRate) < 0) {
      errs.gstRate = 'Invalid GST rate';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const sanitizedData = {
      ...formData,
      amount: baseAmt,
      gstRate: Number(formData.gstRate) || 0,
      gstAmount: gstCalculations.gstAmount,
      totalAmount: gstCalculations.totalAmount,
      deductions: {
        sdAmount: Number(formData.deductions.sdAmount) || 0,
        tdsAmount: Number(formData.deductions.tdsAmount) || 0,
        labourCess: Number(formData.deductions.labourCess) || 0,
        royalty: Number(formData.deductions.royalty) || 0,
        penalty: Number(formData.deductions.penalty) || 0,
      },
      totalDeductions: netCalculations.totalDeductions,
      netPayable: netCalculations.netPayable,
    };

    onSave(sanitizedData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBilling ? 'Edit Bill Record' : 'Create Running Account / Final Bill'}
      subtitle="Government contractor invoice scrutiny, GST validation, and statutory deductions"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {editingBilling ? 'Save Bill Record' : 'Record & Calculate Bill'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Related Work Order & Subdivision Association */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Related Work Order <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.workOrderId}
              onChange={handleWorkOrderSelect}
              className={`block w-full rounded-md border text-xs py-2 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                errors.workOrderId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            >
              <option value="">-- Select Sanctioned Work Order --</option>
              {workOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>
                  {wo.workOrderNumber} | {wo.tenderNumber} - {wo.title || 'Work'}
                </option>
              ))}
            </select>
            {errors.workOrderId && <p className="mt-1 text-xs text-rose-600">{errors.workOrderId}</p>}
          </div>

          <Select
            label="Subdivision Association"
            name="subdivisionId"
            value={formData.subdivisionId}
            onChange={handleSubdivisionChange}
            options={subdivisions.map((s) => ({
              value: s.id,
              label: s.name,
            }))}
            placeholder="Select Subdivision"
          />
        </div>

        {/* Invoice Identifiers and Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Input
            label="Invoice Number"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
            required
            error={errors.invoiceNumber}
            placeholder="e.g. RA-01/PWD/2024"
          />

          <Input
            label="Invoice Date"
            name="invoiceDate"
            type="date"
            value={formData.invoiceDate}
            onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
            required
            error={errors.invoiceDate}
          />

          <Input
            label="Date of Completion"
            name="dateOfCompletion"
            type="date"
            value={formData.dateOfCompletion}
            onChange={(e) => setFormData({ ...formData, dateOfCompletion: e.target.value })}
            helperText="Site measurement date"
          />

          <Input
            label="Date of Handover"
            name="dateOfHandover"
            type="date"
            value={formData.dateOfHandover}
            onChange={(e) => setFormData({ ...formData, dateOfHandover: e.target.value })}
            helperText="Formal department handover"
          />
        </div>

        {/* Amount, GST, and Total Calculation */}
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-blue-700" />
              Bill Valuation & Configurable GST
            </h4>
            <span className="text-[11px] text-blue-700 font-medium">
              Tax Assumption: CGST (50%) + SGST (50%)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Basic Bill Amount (Excl. GST)"
              name="amount"
              type="number"
              step="0.01"
              prefix="₹"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              error={errors.amount}
            />

            <Input
              label="Configurable GST Rate (%)"
              name="gstRate"
              type="number"
              step="0.1"
              suffix="%"
              placeholder="18"
              value={formData.gstRate}
              onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
              required
              error={errors.gstRate}
              helperText={`GST Amount: ${formatCurrency(gstCalculations.gstAmount)}`}
            />

            <div className="w-full">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Amount (Incl. GST)
              </label>
              <div className="rounded-md border border-slate-300 bg-slate-100/90 py-2 px-3 text-sm font-bold text-blue-900 font-mono">
                {formatCurrency(gstCalculations.totalAmount)}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                CGST: {formatCurrency(gstCalculations.cgst)} | SGST: {formatCurrency(gstCalculations.sgst)}
              </span>
            </div>
          </div>
        </div>

        {/* Statutory Deduction Form */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Statutory Deduction Form (PWD Code Rules)
            </h4>
            <span className="text-[11px] text-slate-500">Deductions withheld at source</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Input
              label="SD Deduction"
              name="sdAmount"
              type="number"
              prefix="₹"
              placeholder="5% SD"
              value={formData.deductions.sdAmount}
              onChange={(e) => handleDeductionChange('sdAmount', e.target.value)}
            />

            <Input
              label="IT-TDS (2%)"
              name="tdsAmount"
              type="number"
              prefix="₹"
              placeholder="TDS"
              value={formData.deductions.tdsAmount}
              onChange={(e) => handleDeductionChange('tdsAmount', e.target.value)}
            />

            <Input
              label="Labour Cess (1%)"
              name="labourCess"
              type="number"
              prefix="₹"
              placeholder="Cess"
              value={formData.deductions.labourCess}
              onChange={(e) => handleDeductionChange('labourCess', e.target.value)}
            />

            <Input
              label="Royalty / Material"
              name="royalty"
              type="number"
              prefix="₹"
              placeholder="Royalty"
              value={formData.deductions.royalty}
              onChange={(e) => handleDeductionChange('royalty', e.target.value)}
            />

            <Input
              label="Penalties / Withheld"
              name="penalty"
              type="number"
              prefix="₹"
              placeholder="Penalty"
              value={formData.deductions.penalty}
              onChange={(e) => handleDeductionChange('penalty', e.target.value)}
            />
          </div>

          {/* Computed Net Summary */}
          <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="text-slate-600">
              Total Deductions: <strong className="text-rose-600">{formatCurrency(netCalculations.totalDeductions)}</strong>
            </div>
            <div className="text-sm font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
              Net Payable to Contractor: {formatCurrency(netCalculations.netPayable)}
            </div>
          </div>
        </div>

        {/* Status & Remarks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Bill Processing Status"
            name="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'Draft', label: 'Draft' },
              { value: 'Submitted', label: 'Submitted (By Assistant Engineer)' },
              { value: 'Under Review', label: 'Under Review (Divisional Accountant)' },
              { value: 'Passed', label: 'Passed for Payment (Executive Engineer)' },
            ]}
          />

          <Input
            label="Remarks / Divisional Scrutiny Notes"
            name="remarks"
            placeholder="e.g. Measurement Book Page 42 verified"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
}
