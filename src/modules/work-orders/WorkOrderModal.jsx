import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import { useApp } from '../../context/AppContext';

export default function WorkOrderModal({ isOpen, onClose, onSave, editingWorkOrder }) {
  const { financialYears, subdivisions, activeFY } = useApp();

  const [formData, setFormData] = useState({
    tenderNumber: '',
    workOrderNumber: '',
    workOrderDate: new Date().toISOString().split('T')[0],
    td: '',
    emdNumber: '',
    estimateNumber: '',
    workOrderAmount: '',
    status: 'Issued',
    emdAmount: '',
    sdAmount: '',
    financialYear: activeFY || '2024-2025',
    subdivisionId: '',
    subdivisionName: '',
    title: '',
    contractorName: '',
    stipulatedDateOfCompletion: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingWorkOrder) {
      setFormData({
        tenderNumber: editingWorkOrder.tenderNumber || '',
        workOrderNumber: editingWorkOrder.workOrderNumber || '',
        workOrderDate: editingWorkOrder.workOrderDate || '',
        td: editingWorkOrder.td || '',
        emdNumber: editingWorkOrder.emdNumber || '',
        estimateNumber: editingWorkOrder.estimateNumber || '',
        workOrderAmount: editingWorkOrder.workOrderAmount ?? '',
        status: editingWorkOrder.status || 'Issued',
        emdAmount: editingWorkOrder.emdAmount ?? '',
        sdAmount: editingWorkOrder.sdAmount ?? '',
        financialYear: editingWorkOrder.financialYear || activeFY,
        subdivisionId: editingWorkOrder.subdivisionId || '',
        subdivisionName: editingWorkOrder.subdivisionName || '',
        title: editingWorkOrder.title || '',
        contractorName: editingWorkOrder.contractorName || '',
        stipulatedDateOfCompletion: editingWorkOrder.stipulatedDateOfCompletion || '',
      });
    } else {
      setFormData({
        tenderNumber: '',
        workOrderNumber: '',
        workOrderDate: new Date().toISOString().split('T')[0],
        td: '',
        emdNumber: '',
        estimateNumber: '',
        workOrderAmount: '',
        status: 'Issued',
        emdAmount: '',
        sdAmount: '',
        financialYear: activeFY || '2024-2025',
        subdivisionId: subdivisions[0]?.id || '',
        subdivisionName: subdivisions[0]?.name || '',
        title: '',
        contractorName: '',
        stipulatedDateOfCompletion: '',
      });
    }
    setErrors({});
  }, [editingWorkOrder, isOpen, activeFY, subdivisions]);

  const handleSubdivisionChange = (e) => {
    const subId = e.target.value;
    const found = subdivisions.find((s) => s.id === subId);
    setFormData((prev) => ({
      ...prev,
      subdivisionId: subId,
      subdivisionName: found ? found.name : '',
    }));
  };

  const validate = () => {
    const errs = {};
    // Required core fields
    if (!formData.tenderNumber.trim()) {
      errs.tenderNumber = 'Tender Number is required';
    }
    if (!formData.workOrderNumber.trim()) {
      errs.workOrderNumber = 'Work Order Number is required';
    }

    if (!formData.workOrderDate) {
      errs.workOrderDate = 'Work Order Date is required';
    }

    if (formData.workOrderAmount === '' || isNaN(Number(formData.workOrderAmount)) || Number(formData.workOrderAmount) < 0) {
      errs.workOrderAmount = 'Please enter a valid Work Order Amount';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const sanitizedData = {
      ...formData,
      workOrderAmount: Number(formData.workOrderAmount) || 0,
      emdAmount: formData.emdAmount !== '' ? Number(formData.emdAmount) : 0,
      sdAmount: formData.sdAmount !== '' ? Number(formData.sdAmount) : 0,
    };

    onSave(sanitizedData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingWorkOrder ? 'Edit Work Order' : 'Create Work Order'}
      subtitle="Manage contract details, project scope, budget amounts, and execution schedule"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} className="w-full sm:w-auto shadow-sm">
            {editingWorkOrder ? 'Save Work Order' : 'Issue Work Order'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Core Identifiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <Input
            label="Tender Number"
            name="tenderNumber"
            placeholder="e.g. TN-2024-892"
            value={formData.tenderNumber}
            onChange={(e) => setFormData({ ...formData, tenderNumber: e.target.value })}
            required
            error={errors.tenderNumber}
          />

          <Input
            label="Work Order Number"
            name="workOrderNumber"
            placeholder="e.g. WO-2024-00142"
            value={formData.workOrderNumber}
            onChange={(e) => setFormData({ ...formData, workOrderNumber: e.target.value })}
            required
            error={errors.workOrderNumber}
          />
        </div>

        {/* Work Description & Contractor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <Input
            label="Name of Work / Project Description"
            name="title"
            placeholder="e.g. Construction of High-Level RCC Bridge across Ken Canal"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            helperText="Sanctioned work nomenclature"
          />

          <Input
            label="Contractor / Agency Name"
            name="contractorName"
            placeholder="e.g. M/s Infra Buildcon India Ltd."
            value={formData.contractorName}
            onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
            helperText="Awarded firm or registered vendor"
          />
        </div>

        {/* Dates and Preserved TD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Input
            label="Work Order Date"
            name="workOrderDate"
            type="date"
            value={formData.workOrderDate}
            onChange={(e) => setFormData({ ...formData, workOrderDate: e.target.value })}
            required
            error={errors.workOrderDate}
          />

          <Input
            label="TD"
            name="td"
            placeholder="e.g. TD-TECH-GRADE-A"
            value={formData.td}
            onChange={(e) => setFormData({ ...formData, td: e.target.value })}
            helperText="Preserved field label: TD"
          />

          <Input
            label="Estimate Number"
            name="estimateNumber"
            placeholder="e.g. EST-2024-CIV-441"
            value={formData.estimateNumber}
            onChange={(e) => setFormData({ ...formData, estimateNumber: e.target.value })}
            helperText="Sanctioned estimate reference"
          />
        </div>

        {/* EMD & Financials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Input
            label="Work Order Amount"
            name="workOrderAmount"
            type="number"
            step="0.01"
            prefix="₹"
            placeholder="0.00"
            value={formData.workOrderAmount}
            onChange={(e) => setFormData({ ...formData, workOrderAmount: e.target.value })}
            required
            error={errors.workOrderAmount}
          />

          <Input
            label="EMD Number"
            name="emdNumber"
            placeholder="e.g. EMD-SBIN-88912"
            value={formData.emdNumber}
            onChange={(e) => setFormData({ ...formData, emdNumber: e.target.value })}
            helperText="Earnest Money Deposit reference"
          />

          <Input
            label="EMD Amount"
            name="emdAmount"
            type="number"
            step="0.01"
            prefix="₹"
            placeholder="0.00"
            value={formData.emdAmount}
            onChange={(e) => setFormData({ ...formData, emdAmount: e.target.value })}
          />
        </div>

        {/* SD Amount & Associations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Input
            label="SD Amount"
            name="sdAmount"
            type="number"
            step="0.01"
            prefix="₹"
            placeholder="0.00"
            value={formData.sdAmount}
            onChange={(e) => setFormData({ ...formData, sdAmount: e.target.value })}
            helperText="Security Deposit amount"
          />

          <Select
            label="Status / Options"
            name="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'Draft', label: 'Draft' },
              { value: 'Issued', label: 'Issued' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Terminated', label: 'Terminated' },
            ]}
          />

          <Select
            label="Financial Year Association"
            name="financialYear"
            value={formData.financialYear}
            onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
            options={financialYears.map((fy) => ({
              value: fy.label,
              label: `FY ${fy.label}`,
            }))}
            required
          />

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

        <Input
          label="Stipulated Date of Completion"
          name="stipulatedDateOfCompletion"
          type="date"
          value={formData.stipulatedDateOfCompletion}
          onChange={(e) => setFormData({ ...formData, stipulatedDateOfCompletion: e.target.value })}
          helperText="Target handover date as per contract terms"
        />
      </form>
    </Modal>
  );
}
