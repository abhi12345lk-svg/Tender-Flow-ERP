import React, { useState } from 'react';
import { Plus, Network, Edit2, Trash2, Building2, CheckCircle2, FileSpreadsheet, Receipt } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SubdivisionModal from './SubdivisionModal';

export default function SubdivisionsPage() {
  const { subdivisions, addSubdivision, updateSubdivision, deleteSubdivision, workOrders, billingList } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [selectedSubdivisionId, setSelectedSubdivisionId] = useState('ALL');

  const filteredSubdivisions = selectedSubdivisionId === 'ALL'
    ? subdivisions
    : subdivisions.filter((s) => s.id === selectedSubdivisionId);

  const handleCreateNew = () => {
    setEditingSub(null);
    setIsModalOpen(true);
  };

  const handleEdit = (sub) => {
    setEditingSub(sub);
    setIsModalOpen(true);
  };

  const handleSave = (data) => {
    if (editingSub) {
      updateSubdivision(editingSub.id, data);
    } else {
      addSubdivision(data);
    }
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteSubdivision(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const columns = [
    {
      header: 'Subdivision Name',
      key: 'name',
      render: (val, row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{val}</span>
          <span className="text-[11px] text-slate-400 font-mono">Code: {row.code || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'In-Charge Officer',
      key: 'inCharge',
      render: (val) => <span className="text-xs text-slate-700">{val || 'Officer in Charge'}</span>,
    },
    {
      header: 'Location / Area',
      key: 'location',
      render: (val) => <span className="text-xs text-slate-500">{val || 'Division Area'}</span>,
    },
    {
      header: 'Associated Work Orders',
      key: 'id',
      render: (subId) => {
        const count = workOrders.filter((w) => w.subdivisionId === subId).length;
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 text-xs">
            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
            {count} {count === 1 ? 'Work Order' : 'Work Orders'}
          </span>
        );
      },
    },
    {
      header: 'Associated Billing Records',
      key: 'id',
      render: (subId) => {
        const count = billingList.filter((b) => b.subdivisionId === subId).length;
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 text-xs">
            <Receipt className="h-3.5 w-3.5 text-emerald-600" />
            {count} {count === 1 ? 'Bill Voucher' : 'Bill Vouchers'}
          </span>
        );
      },
    },
    {
      header: 'Status',
      key: 'status',
      render: (val) => <Badge variant={val}>{val}</Badge>,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title="Edit Subdivision"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleteTargetId(row.id)}
            className="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Subdivision"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Subdivision Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Minimal administrative units linked with sanctioned Work Orders and Billing vouchers.
          </p>
        </div>

        <Button icon={Plus} onClick={handleCreateNew}>
          Add Subdivision
        </Button>
      </div>

      {/* Subdivision Selector / Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Network className="h-4 w-4 text-blue-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-700">Subdivision Selector:</span>
          <select
            value={selectedSubdivisionId}
            onChange={(e) => setSelectedSubdivisionId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-blue-600 min-w-[200px]"
          >
            <option value="ALL">All Subdivisions ({subdivisions.length})</option>
            {subdivisions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code || 'SD'})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Total Subdivisions: <strong className="text-slate-800">{subdivisions.length}</strong>
        </div>
      </div>

      {/* Subdivisions Table */}
      <DataTable
        columns={columns}
        data={filteredSubdivisions}
        emptyTitle="No Subdivisions Configured"
        emptyDescription="Add a subdivision to categorize and route divisional work orders and contractor billing."
        emptyActionLabel="Add Subdivision"
        onEmptyAction={handleCreateNew}
      />

      {/* Associated Records Inspector (when a specific subdivision is selected) */}
      {selectedSubdivisionId !== 'ALL' && (
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Linked Departmental Records in Selected Subdivision
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 border rounded-lg bg-slate-50 space-y-2">
              <span className="font-semibold text-slate-700 block">
                Work Orders Associated ({workOrders.filter((w) => w.subdivisionId === selectedSubdivisionId).length}):
              </span>
              <ul className="space-y-1">
                {workOrders
                  .filter((w) => w.subdivisionId === selectedSubdivisionId)
                  .map((w) => (
                    <li key={w.id} className="text-slate-600 font-mono bg-white p-1.5 rounded border border-slate-200">
                      {w.workOrderNumber} - {w.title}
                    </li>
                  ))}
                {workOrders.filter((w) => w.subdivisionId === selectedSubdivisionId).length === 0 && (
                  <li className="text-slate-400 italic">No work orders linked to this subdivision yet.</li>
                )}
              </ul>
            </div>

            <div className="p-3 border rounded-lg bg-slate-50 space-y-2">
              <span className="font-semibold text-slate-700 block">
                Billing Vouchers Associated ({billingList.filter((b) => b.subdivisionId === selectedSubdivisionId).length}):
              </span>
              <ul className="space-y-1">
                {billingList
                  .filter((b) => b.subdivisionId === selectedSubdivisionId)
                  .map((b) => (
                    <li key={b.id} className="text-slate-600 font-mono bg-white p-1.5 rounded border border-slate-200">
                      {b.invoiceNumber} (WO: {b.workOrderNumber})
                    </li>
                  ))}
                {billingList.filter((b) => b.subdivisionId === selectedSubdivisionId).length === 0 && (
                  <li className="text-slate-400 italic">No billing records linked to this subdivision yet.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <SubdivisionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingSubdivision={editingSub}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Delete Subdivision?"
        message="Are you sure you want to delete this subdivision? If any Work Orders are associated, deletion will be blocked to maintain data integrity."
        confirmText="Confirm Delete"
      />
    </div>
  );
}
