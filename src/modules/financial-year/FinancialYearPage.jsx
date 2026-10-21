import React, { useState } from 'react';
import { Plus, Calendar, CheckCircle2, Edit2, Trash2, ShieldCheck, AlertCircle, Printer, FileSpreadsheet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FinancialYearModal from './FinancialYearModal';
import PrintableReportModal from '../../components/common/PrintableReportModal';
import { exportFinancialYearsExcel } from '../../services/export';

export default function FinancialYearPage() {
  const {
    financialYears,
    activeFY,
    setActiveFY,
    addFinancialYear,
    updateFinancialYear,
    deleteFinancialYear,
    workOrders,
    addToast,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFy, setEditingFy] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Client-side Excel (.xlsx) Register Export
  const handleExportExcel = () => {
    if (filteredYears.length === 0) {
      addToast({
        type: 'warning',
        title: 'No Records',
        message: 'No financial year records available to export.',
      });
      return;
    }
    exportFinancialYearsExcel(filteredYears, workOrders);
    addToast({
      type: 'success',
      title: 'Excel Register Exported',
      message: `Downloaded financial years register (${filteredYears.length} records) as .xlsx.`,
    });
  };

  // Filter FYs
  const filteredYears = financialYears.filter((fy) =>
    fy.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fy.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fy.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = () => {
    setEditingFy(null);
    setIsModalOpen(true);
  };

  const handleEdit = (fy) => {
    setEditingFy(fy);
    setIsModalOpen(true);
  };

  const handleSave = (formData) => {
    if (editingFy) {
      updateFinancialYear(editingFy.id, formData);
    } else {
      addFinancialYear(formData);
    }
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteFinancialYear(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const columns = [
    {
      header: 'Financial Year',
      key: 'label',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-sm">{val}</span>
          {row.label === activeFY && (
            <span className="inline-flex items-center gap-1 rounded bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5">
              <CheckCircle2 className="h-3 w-3" />
              Active Context
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Start Date',
      key: 'startDate',
      render: (val) => formatDate(val),
    },
    {
      header: 'End Date',
      key: 'endDate',
      render: (val) => formatDate(val),
    },
    {
      header: 'Status',
      key: 'status',
      render: (val) => <Badge variant={val}>{val}</Badge>,
    },
    {
      header: 'Associated Works',
      key: 'id',
      render: (_, row) => {
        const count = workOrders.filter((w) => w.financialYear === row.label).length;
        return (
          <span className="font-semibold text-slate-700">
            {count} {count === 1 ? 'Work Order' : 'Work Orders'}
          </span>
        );
      },
    },
    {
      header: 'Notes / Description',
      key: 'description',
      render: (val) => <span className="text-slate-500 truncate max-w-xs block">{val || '-'}</span>,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.label !== activeFY && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveFY(row.label)}
              title="Set as system-wide active financial year"
            >
              Activate
            </Button>
          )}

          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title="Edit Dates & Details"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setDeleteTargetId(row.id)}
            disabled={row.label === activeFY}
            className={`p-1.5 rounded transition-colors ${
              row.label === activeFY
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
            }`}
            title={row.label === activeFY ? 'Active FY cannot be deleted' : 'Delete Financial Year'}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Financial Year Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage fiscal cycles, start-end accounting boundaries, and active divisional budgets.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            icon={FileSpreadsheet}
            onClick={handleExportExcel}
            className="w-full sm:w-auto text-xs"
            title="Export financial years register to Excel (.xlsx)"
          >
            Export Excel (.xlsx)
          </Button>
          <Button
            variant="outline"
            icon={Printer}
            onClick={() => setIsReportModalOpen(true)}
            className="w-full sm:w-auto text-xs"
            title="Print or save A4 PDF financial years register report"
          >
            Print / PDF Register
          </Button>
          <Button icon={Plus} onClick={handleCreateNew} className="w-full sm:w-auto shadow-sm">
            Add Financial Year
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Active Operating FY
            </span>
            <span className="text-lg sm:text-xl font-bold text-blue-700 mt-1 block">FY {activeFY}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Configured Fiscal Cycles
            </span>
            <span className="text-lg sm:text-xl font-bold text-slate-800 mt-1 block">
              {financialYears.length} Years
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Works in Active FY
            </span>
            <span className="text-lg sm:text-xl font-bold text-slate-800 mt-1 block">
              {workOrders.filter((w) => w.financialYear === activeFY).length} Work Orders
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="space-y-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Search financial years..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 sm:py-1.5 text-base sm:text-xs rounded-md border border-slate-300 focus:outline-none focus:border-blue-600 min-h-[40px] sm:min-h-0"
          />
          <div className="text-xs text-slate-500 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex items-center justify-between sm:justify-end">
            <span>Total records: <strong className="text-slate-800">{filteredYears.length}</strong></span>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredYears}
          emptyTitle="No Financial Years Found"
          emptyDescription="No fiscal cycle matched your search criteria."
          emptyActionLabel="Add Financial Year"
          onEmptyAction={handleCreateNew}
        />
      </div>

      {/* Create / Edit Modal */}
      <FinancialYearModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingFy={editingFy}
      />

      {/* Printable Financial Years Register Report Modal */}
      <PrintableReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Financial Year Master Cycle & Fiscal Boundaries Report"
        subtitle="Public Works Department | Division No. 1"
        reportType="financial-year"
        data={filteredYears}
        activeFY={activeFY}
        onExportExcel={handleExportExcel}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Delete Financial Year?"
        message="Are you sure you want to delete this financial year? Associated works will remain in session memory but will lose their fiscal link."
        confirmText="Confirm Delete"
      />
    </div>
  );
}
