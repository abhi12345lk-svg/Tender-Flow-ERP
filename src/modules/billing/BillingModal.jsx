import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import { useApp } from '../../context/AppContext';
import { calculateBillingBreakdown, DEFAULT_BILLING_RATES } from '../../services/billing/billingCalculationConfig';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Calculator, AlertCircle, Percent, Info, ShieldAlert } from 'lucide-react';

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
    gstRate: DEFAULT_BILLING_RATES.gst.defaultRate, // Configurable tax assumption
    status: 'Submitted',
    deductions: {
      sdAmount: '',
      tdsAmount: '',
      labourCess: '',
      royalty: '',
      penalty: '',
      gstTdsAmount: '',
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
        gstRate: editingBilling.gstRate ?? DEFAULT_BILLING_RATES.gst.defaultRate,
        status: editingBilling.status || 'Submitted',
        deductions: {
          sdAmount: editingBilling.deductions?.sdAmount ?? '',
          tdsAmount: editingBilling.deductions?.tdsAmount ?? '',
          labourCess: editingBilling.deductions?.labourCess ?? '',
          royalty: editingBilling.deductions?.royalty ?? '',
          penalty: editingBilling.deductions?.penalty ?? '',
          gstTdsAmount: editingBilling.deductions?.gstTdsAmount ?? '',
        },
        remarks: editingBilling.remarks || '',
      });
    } else {
      const defaultWo = workOrders[0];
      setFormData({
        invoiceNumber: `RA-0${Math.floor(1 + Math.random() * 9)}/TF/${new Date().getFullYear()}`,
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
        gstRate: DEFAULT_BILLING_RATES.gst.defaultRate,
        status: 'Submitted',
        deductions: {
          sdAmount: '',
          tdsAmount: '',
          labourCess: '',
          royalty: '',
          penalty: '',
          gstTdsAmount: '',
        },
        remarks: '',
      });
    }
    setErrors({});
  }, [editingBilling, isOpen, workOrders, subdivisions]);

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
        subdivisionId: wo.subdivisionId || prev.subdivisionId,
        subdivisionName: wo.subdivisionName || prev.subdivisionName,
        financialYear: wo.financialYear || prev.financialYear || '',
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
    const found = subdivisions.find((s) => s.id === subId || s._id === subId);
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

  // Centralized billing breakdown calculation
  const breakdown = calculateBillingBreakdown(formData.amount, formData.gstRate, formData.deductions);
  const { deductionBreakdown } = breakdown;

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
      amount: breakdown.baseAmount,
      gstRate: breakdown.gstRate,
      gstAmount: breakdown.gstAmount,
      totalAmount: breakdown.totalAmount,
      deductions: {
        sdAmount: breakdown.deductions.sdAmount,
        tdsAmount: breakdown.deductions.tdsAmount,
        labourCess: breakdown.deductions.labourCess,
        royalty: breakdown.deductions.royalty,
        penalty: breakdown.deductions.penalty,
        gstTdsAmount: breakdown.deductions.gstTdsAmount,
      },
      totalDeductions: breakdown.totalDeductions,
      netPayable: breakdown.netPayable,
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
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} className="w-full sm:w-auto shadow-sm">
            {editingBilling ? 'Save Bill Record' : 'Record & Calculate Bill'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Related Work Order & Subdivision Association */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Related Work Order <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.workOrderId}
              onChange={handleWorkOrderSelect}
              className={`block w-full rounded-md border text-base sm:text-xs py-2 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 min-h-[40px] sm:min-h-0 cursor-pointer ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Input
            label="Invoice Number"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
            required
            error={errors.invoiceNumber}
            placeholder="e.g. RA-01/TF/2024"
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
        <div className="p-3.5 sm:p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-blue-700" />
              Bill Valuation & Configurable GST
            </h4>
            <span className="text-[11px] text-blue-700 font-medium">
              Tax Assumption: CGST (50%) + SGST (50%)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
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
              helperText={`GST Amount: ${formatCurrency(breakdown.gstAmount)}`}
            />

            <div className="w-full">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Amount (Incl. GST)
              </label>
              <div className="rounded-md border border-slate-300 bg-slate-100/90 py-2 px-3 text-sm font-bold text-blue-900 font-mono min-h-[40px] sm:min-h-0 flex items-center">
                {formatCurrency(breakdown.totalAmount)}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                CGST: {formatCurrency(breakdown.cgst)} | SGST: {formatCurrency(breakdown.sgst)}
              </span>
            </div>
          </div>
        </div>

        {/* Statutory Deduction Form */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Statutory Deduction Form (Standard Enterprise Rates & Calculation Bases)
            </h4>
            <span className="text-[11px] text-slate-500">Deductions withheld at source</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-700">
                  SD Retention ({DEFAULT_BILLING_RATES.sd.defaultRate}% on Base)
                </span>
                {deductionBreakdown.sd.isOverridden && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Override
                  </span>
                )}
              </div>
              <Input
                name="sdAmount"
                type="number"
                prefix="₹"
                placeholder={`Auto: ${formatCurrency(deductionBreakdown.sd.computedAmount)}`}
                value={formData.deductions.sdAmount}
                onChange={(e) => handleDeductionChange('sdAmount', e.target.value)}
                helperText={`Standard: ${DEFAULT_BILLING_RATES.sd.defaultRate}% on base (₹${formatCurrency(deductionBreakdown.sd.computedAmount)})`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-700">
                  IT-TDS ({DEFAULT_BILLING_RATES.itTds.defaultRate}% on Base)
                </span>
                {deductionBreakdown.itTds.isOverridden && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Override
                  </span>
                )}
              </div>
              <Input
                name="tdsAmount"
                type="number"
                prefix="₹"
                placeholder={`Auto: ${formatCurrency(deductionBreakdown.itTds.computedAmount)}`}
                value={formData.deductions.tdsAmount}
                onChange={(e) => handleDeductionChange('tdsAmount', e.target.value)}
                helperText={`Sec 194C: ${DEFAULT_BILLING_RATES.itTds.defaultRate}% on base (₹${formatCurrency(deductionBreakdown.itTds.computedAmount)})`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-700">
                  Labour Cess ({DEFAULT_BILLING_RATES.labourCess.defaultRate}% on Base)
                </span>
                {deductionBreakdown.labourCess.isOverridden && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Override
                  </span>
                )}
              </div>
              <Input
                name="labourCess"
                type="number"
                prefix="₹"
                placeholder={`Auto: ${formatCurrency(deductionBreakdown.labourCess.computedAmount)}`}
                value={formData.deductions.labourCess}
                onChange={(e) => handleDeductionChange('labourCess', e.target.value)}
                helperText={`BOCW: ${DEFAULT_BILLING_RATES.labourCess.defaultRate}% on base (₹${formatCurrency(deductionBreakdown.labourCess.computedAmount)})`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-700">
                  GST TDS ({DEFAULT_BILLING_RATES.gstTds.defaultRate}% on Base)
                </span>
                {deductionBreakdown.gstTds.isOverridden && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Override
                  </span>
                )}
              </div>
              <Input
                name="gstTdsAmount"
                type="number"
                prefix="₹"
                placeholder="Optional (Contract > ₹2.5L)"
                value={formData.deductions.gstTdsAmount}
                onChange={(e) => handleDeductionChange('gstTdsAmount', e.target.value)}
                helperText={`Sec 51: ${DEFAULT_BILLING_RATES.gstTds.defaultRate}% on base if applicable`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-700">Mineral Royalty</span>
                <span className="text-[10px] text-slate-400">Manual / Seigniorage</span>
              </div>
              <Input
                name="royalty"
                type="number"
                prefix="₹"
                placeholder="0.00"
                value={formData.deductions.royalty}
                onChange={(e) => handleDeductionChange('royalty', e.target.value)}
                helperText="Seigniorage per contract schedule"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-700">Penalty / Withheld</span>
                <span className="text-[10px] text-slate-400">Contractual</span>
              </div>
              <Input
                name="penalty"
                type="number"
                prefix="₹"
                placeholder="0.00"
                value={formData.deductions.penalty}
                onChange={(e) => handleDeductionChange('penalty', e.target.value)}
                helperText="Liquidated damages or retention"
              />
            </div>
          </div>

          {/* Computed Net Summary */}
          <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="text-slate-600 text-center sm:text-left">
              Total Deductions: <strong className="text-rose-600">{formatCurrency(breakdown.totalDeductions)}</strong>
            </div>
            <div className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 w-full sm:w-auto text-center sm:text-right">
              Net Disbursable to Contractor: {formatCurrency(breakdown.netPayable)}
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
