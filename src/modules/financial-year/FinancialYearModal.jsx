import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';

export default function FinancialYearModal({ isOpen, onClose, onSave, editingFy }) {
  const [formData, setFormData] = useState({
    label: '',
    startDate: '',
    endDate: '',
    status: 'Upcoming',
    description: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingFy) {
      setFormData({
        label: editingFy.label || '',
        startDate: editingFy.startDate || '',
        endDate: editingFy.endDate || '',
        status: editingFy.status || 'Upcoming',
        description: editingFy.description || '',
      });
    } else {
      // Default to next FY dates
      const currentYear = new Date().getFullYear();
      setFormData({
        label: `${currentYear}-${currentYear + 1}`,
        startDate: `${currentYear}-04-01`,
        endDate: `${currentYear + 1}-03-31`,
        status: 'Upcoming',
        description: '',
      });
    }
    setErrors({});
  }, [editingFy, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.label.trim()) {
      errs.label = 'Financial Year label is required (e.g. 2024-2025)';
    } else if (!/^\d{4}-\d{4}$/.test(formData.label.trim())) {
      errs.label = 'Format must be YYYY-YYYY (e.g. 2024-2025)';
    }

    if (!formData.startDate) {
      errs.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errs.endDate = 'End date is required';
    } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      errs.endDate = 'End date must be strictly after Start date';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingFy ? 'Edit Financial Year' : 'Create New Financial Year'}
      subtitle="Define fiscal accounting cycle dates for government works and billing"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {editingFy ? 'Save Changes' : 'Create Financial Year'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Financial Year Label"
          name="label"
          placeholder="e.g. 2024-2025"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          required
          error={errors.label}
          helperText="Format: 4-digit start year followed by hyphen and 4-digit end year"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
            error={errors.startDate}
            helperText="Standard Indian FY begins 1st April"
          />

          <Input
            label="End Date"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
            error={errors.endDate}
            helperText="Standard Indian FY concludes 31st March"
          />
        </div>

        <Select
          label="Initial Status"
          name="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          options={[
            { value: 'Active', label: 'Active (Current Operational Period)' },
            { value: 'Upcoming', label: 'Upcoming (Advance Budgeting / Sanctions)' },
            { value: 'Closed', label: 'Closed (Audited & Locked Period)' },
          ]}
          required
        />

        <Input
          label="Description / Department Note"
          name="description"
          placeholder="e.g. Sanctioned under 15th Finance Commission Grant"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          helperText="Optional reference or remarks"
        />

        <div className="rounded-md bg-amber-50 p-2.5 border border-amber-200 text-xs text-amber-800">
          <span className="font-semibold">Note:</span> Creating or updating financial years in Step 1 modifies frontend in-memory state. Full database sync occurs in Step 2.
        </div>
      </form>
    </Modal>
  );
}
