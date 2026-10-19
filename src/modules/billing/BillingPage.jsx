import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Receipt,
  Calculator,
  IndianRupee,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import BillingModal from './BillingModal';
import BillingDetailModal from './BillingDetailModal';

export default function BillingPage() {
  const { billingList, addBilling, updateBilling, deleteBilling, workOrders, subdivisions, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [subdivisionFilter, setSubdivisionFilter] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBilling, setEditingBilling] = useState(null);
  const [viewingBilling, setViewingBilling] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredBills = billingList.filter((bill) => {
    const matchesSearch =
      bill.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.contractorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.tenderNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || bill.status === statusFilter;
    const matchesSub = subdivisionFilter === 'ALL' || bill.subdivisionId === subdivisionFilter;

    return matchesSearch && matchesStatus && matchesSub;
  });

  const paginatedBills = filteredBills.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreateNew = () => {
    if (workOrders.length === 0) {
      addToast({
        type: 'warning',
        title: 'Work Order Required',
        message: 'Please create a Work Order before generating a Bill voucher.',
      });
      return;
    }
    setEditingBilling(null);
    setIsModalOpen(true);
  };

  const handleEdit = (bill) => {
    setEditingBilling(bill);
    setIsModalOpen(true);
  };

  const handleSave = (data) => {
    if (editingBilling) {
      updateBilling(editingBilling.id, data);
    } else {
      addBilling(data);
    }
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteBilling(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  // Aggregated values
  const totalBilledValue = billingList.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const totalDeductionsValue = billingList.reduce((acc, b) => acc + (b.totalDeductions || 0), 0);
  const totalNetValue = billingList.reduce((acc, b) => acc + (b.netPayable || 0), 0);

  const columns = [
    {
      header: 'Invoice No.',
      key: 'invoiceNumber',
      render: (val, row) => (
        <div>
          <button
            onClick={() => setViewingBilling(row)}
            className="font-bold text-blue-700 hover:text-blue-900 font-mono text-xs hover:underline text-left block"
          >
            {val}
          </button>
          <span className="text-[11px] text-slate-500 font-mono">Date: {formatDate(row.invoiceDate)}</span>
        </div>
      ),
    },
    {
      header: 'Related Work Order',
      key: 'workOrderNumber',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-900 font-mono text-xs block">{val}</span>
          <span className="text-[11px] text-slate-500 truncate max-w-xs block" title={row.contractorName}>
            {row.contractorName}
          </span>
        </div>
      ),
    },
    {
      header: 'Completion / Handover',
      key: 'dateOfCompletion',
      render: (val, row) => (
        <div className="text-xs">
          <span className="text-slate-700 block">Comp: {formatDate(val)}</span>
          <span className="text-[11px] text-slate-500 block">H/O: {formatDate(row.dateOfHandover)}</span>
        </div>
      ),
    },
    {
      header: 'Basic Amount',
      key: 'amount',
      align: 'right',
      render: (val) => (
        <span className="font-mono text-xs text-slate-700 font-medium">
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      header: 'GST (Rate / Amt)',
      key: 'gstAmount',
      align: 'right',
      render: (val, row) => (
        <div className="text-right">
          <span className="font-mono text-xs text-slate-700 font-medium">{formatCurrency(val)}</span>
          <span className="text-[10px] text-slate-400 block font-mono">Rate: {row.gstRate || 18}%</span>
        </div>
      ),
    },
    {
      header: 'Total Amount',
      key: 'totalAmount',
      align: 'right',
      render: (val) => (
        <span className="font-bold font-mono text-xs text-blue-950">
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      header: 'Deductions / Net',
      key: 'netPayable',
      align: 'right',
      render: (val, row) => (
        <div className="text-right">
          <span className="font-bold font-mono text-xs text-emerald-800">{formatCurrency(val)}</span>
          <span className="text-[10px] text-rose-600 block font-mono">
            Ded: -{formatCurrency(row.totalDeductions || 0)}
          </span>
        </div>
      ),
    },
    {
      header: 'Subdivision',
      key: 'subdivisionName',
      render: (val) => (
        <span className="text-xs text-slate-700 truncate max-w-[130px] block" title={val}>
          {val || 'General'}
        </span>
      ),
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
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setViewingBilling(row)}
            className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title="View Scrutiny & Deduction Breakdown"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title="Edit Bill Details"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleteTargetId(row.id)}
            className="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Bill Entry"
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
            Billing Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Running account bills, GST computation, PWD statutory deduction scrutiny, and net disbursement calculations.
          </p>
        </div>

        <Button icon={Plus} onClick={handleCreateNew}>
          Create Bill Voucher
        </Button>
      </div>

      {/* Summary Valuation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Gross Billed Amount (with GST)
            </span>
            <span className="text-lg font-bold text-slate-900 mt-1 block">
              {formatCurrency(totalBilledValue)}
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Statutory Withheld Deductions
            </span>
            <span className="text-lg font-bold text-rose-600 mt-1 block">
              {formatCurrency(totalDeductionsValue)}
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <Calculator className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Net Payable Disbursable
            </span>
            <span className="text-lg font-bold text-emerald-700 mt-1 block">
              {formatCurrency(totalNetValue)}
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice #, work order, vendor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:border-blue-600"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Passed">Passed for Payment</option>
          </select>

          <select
            value={subdivisionFilter}
            onChange={(e) => {
              setSubdivisionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">All Subdivisions</option>
            {subdivisions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong className="text-slate-800">{filteredBills.length}</strong> bill vouchers
        </div>
      </div>

      {/* Billing Data Table */}
      <DataTable
        columns={columns}
        data={paginatedBills}
        currentPage={currentPage}
        totalItems={filteredBills.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        emptyTitle="No Billing Vouchers Found"
        emptyDescription="No bills have been submitted matching the selected filters. Use Create Bill Voucher to register contractor invoices."
        emptyActionLabel="Create Bill Voucher"
        onEmptyAction={handleCreateNew}
      />

      {/* Create / Edit Modal */}
      <BillingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingBilling={editingBilling}
      />

      {/* Bill Details Modal */}
      <BillingDetailModal
        isOpen={Boolean(viewingBilling)}
        onClose={() => setViewingBilling(null)}
        billing={viewingBilling}
        onEdit={handleEdit}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Delete Bill Voucher?"
        message="Are you sure you want to delete this billing record? This will remove the voucher from the current session ledger."
        confirmText="Confirm Delete"
      />
    </div>
  );
}
