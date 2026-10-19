import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';

export default function SubdivisionModal({ isOpen, onClose, onSave, editingSubdivision }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    inCharge: '',
    location: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingSubdivision) {
      setFormData({
        name: editingSubdivision.name || '',
        code: editingSubdivision.code || '',
        inCharge: editingSubdivision.inCharge || '',
        location: editingSubdivision.location || '',
        status: editingSubdivision.status || 'Active',
      });
    } else {
      setFormData({
        name: '',
        code: `SD-${Math.floor(10 + Math.random() * 90)}`,
        inCharge: '',
        location: '',
        status: 'Active',
      });
    }
    setErrors({});
  }, [editingSubdivision, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Subdivision Name is required';
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
      title={editingSubdivision ? 'Edit Subdivision' : 'Add New Subdivision'}
      subtitle="Define administrative subdivision unit for Work Order and Billing associations"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} className="w-full sm:w-auto shadow-sm">
            {editingSubdivision ? 'Save Changes' : 'Add Subdivision'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Subdivision Name"
          name="name"
          placeholder="e.g. Subdivision I (Civil & Buildings)"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          error={errors.name}
          helperText="Administrative sub-unit name"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Subdivision Code"
            name="code"
            placeholder="e.g. SD-CIVIL-01"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            helperText="Internal departmental code"
          />

          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
          />
        </div>

        <Input
          label="Assistant Engineer / In-Charge"
          name="inCharge"
          placeholder="e.g. Er. Suresh Verma, A.E."
          value={formData.inCharge}
          onChange={(e) => setFormData({ ...formData, inCharge: e.target.value })}
          helperText="Responsible field officer"
        />

        <Input
          label="Office Location / Campus"
          name="location"
          placeholder="e.g. Central Division Complex"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
      </form>
    </Modal>
  );
}
