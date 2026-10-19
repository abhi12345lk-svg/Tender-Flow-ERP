import React, { useState } from 'react';
import { Plus, Search, Filter, Eye, Edit2, Trash2, FileSpreadsheet, Building, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import WorkOrderModal from './WorkOrderModal';
import WorkOrderDetailModal from './WorkOrderDetailModal';

export default function WorkOrdersPage() {
  const { workOrders, addWorkOrder, updateWorkOrder, deleteWorkOrder, subdivisions, financialYears } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [subdivisionFilter, setSubdivisionFilter] = useState('ALL');
  const [fyFilter, setFyFilter] = useState('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWo, setEditingWo] = useState(null);
  const [viewingWo, setViewingWo] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Filter logic
  const filteredData = workOrders.filter((wo) => {
    const matchesSearch =
      wo.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.tenderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.contractorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.td?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.estimateNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter;
    const matchesSub = subdivisionFilter === 'ALL' || wo.subdivisionId === subdivisionFilter;
    const matchesFy = fyFilter === 'ALL' || wo.financialYear === fyFilter;

    return matchesSearch && matchesStatus && matchesSub && matchesFy;
  });

  // Paginated records
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreateNew = () => {
    setEditingWo(null);
    setIsModalOpen(true);
  };

  const handleEdit = (wo) => {
    setEditingWo(wo);
    setIsModalOpen(true);
  };

  const handleSave = (data) => {
    if (editingWo) {
      updateWorkOrder(editingWo.id, data);
    } else {
      addWorkOrder(data);
    }
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteWorkOrder(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const columns = [
    {
      header: 'Work Order No. (M)',
      key: 'workOrderNumber',
      render: (val, row) => (
        <div>
          <button
            onClick={() => setViewingWo(row)}
            className="font-bold text-blue-700 hover:text-blue-900 font-mono text-xs hover:underline text-left block"
          >
            {val}
          </button>
          <span className="text-[11px] text-slate-500 font-mono">TN: {row.tenderNumber}</span>
        </div>
      ),
    },
    {
      header: 'Work Description / Contractor',
      key: 'title',
      render: (val, row) => (
        <div className="max-w-xs truncate">
          <span className="font-medium text-slate-800 text-xs block truncate" title={val}>
            {val || 'Infrastructure Works'}
          </span>
          <span className="text-[11px] text-slate-500 block truncate" title={row.contractorName}>
            {row.contractorName || 'Govt. Agency'}
          </span>
        </div>
      ),
    },
    {
      header: 'WO Date',
      key: 'workOrderDate',
      render: (val) => formatDate(val),
    },
    {
      header: 'TD',
      key: 'td',
      render: (val) => <span className="font-mono text-xs text-slate-700">{val || '-'}</span>,
    },
    {
      header: 'Estimate No.',
      key: 'estimateNumber',
      render: (val) => <span className="text-xs text-slate-600 font-mono">{val || '-'}</span>,
    },
    {
      header: 'Work Order Amount',
      key: 'workOrderAmount',
      align: 'right',
      render: (val) => (
        <span className="font-semibold text-slate-900 font-mono text-xs">
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      header: 'EMD / SD Amount',
      key: 'sdAmount',
      align: 'right',
      render: (_, row) => (
        <div className="text-right">
          <div className="text-xs text-slate-700 font-mono">SD: {formatCurrency(row.sdAmount)}</div>
          <div className="text-[10px] text-slate-500 font-mono">EMD: {formatCurrency(row.emdAmount)}</div>
        </div>
      ),
    },
    {
      header: 'Subdivision',
      key: 'subdivisionName',
      render: (val) => (
        <span className="text-xs text-slate-700 truncate max-w-[140px] block" title={val}>
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
            onClick={() => setViewingWo(row)}
            className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title="View Full Details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title="Edit Work Order"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleteTargetId(row.id)}
            className="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Work Order"
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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Work Order Management
            </h1>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
              Active FY: {useApp().activeFY}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Preserving mandated Tender Number (M), Work Order Number (M), TD and departmental accounting rules.
          </p>
        </div>

        <Button icon={Plus} onClick={handleCreateNew} className="w-full sm:w-auto shadow-sm">
          Create Work Order
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 sm:top-2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by WO#, Tender#, Title, TD..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 sm:py-1.5 text-base sm:text-xs rounded-md border border-slate-300 focus:outline-none focus:border-blue-600 min-h-[40px] sm:min-h-0"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 sm:py-1.5 text-base sm:text-xs rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-blue-600 min-h-[40px] sm:min-h-0 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Issued">Issued</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Terminated">Terminated</option>
          </select>

          {/* Subdivision Filter */}
          <select
            value={subdivisionFilter}
            onChange={(e) => {
              setSubdivisionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 sm:py-1.5 text-base sm:text-xs rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-blue-600 min-h-[40px] sm:min-h-0 cursor-pointer"
          >
            <option value="ALL">All Subdivisions</option>
            {subdivisions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* FY Filter */}
          <select
            value={fyFilter}
            onChange={(e) => {
              setFyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 sm:py-1.5 text-base sm:text-xs rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-blue-600 min-h-[40px] sm:min-h-0 cursor-pointer"
          >
            <option value="ALL">All Financial Years</option>
            {financialYears.map((fy) => (
              <option key={fy.id} value={fy.label}>
                FY {fy.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{filteredData.length}</strong> matching work order(s)
          </span>
          {(searchTerm || statusFilter !== 'ALL' || subdivisionFilter !== 'ALL' || fyFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setSubdivisionFilter('ALL');
                setFyFilter('ALL');
                setCurrentPage(1);
              }}
              className="text-blue-600 hover:underline font-medium py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Work Orders Data Table */}
      <DataTable
        columns={columns}
        data={paginatedData}
        currentPage={currentPage}
        totalItems={filteredData.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        emptyTitle="No Work Orders Found"
        emptyDescription="No records match your filters. Try clearing the search query or create a new Work Order."
        emptyActionLabel="Create Work Order"
        onEmptyAction={handleCreateNew}
      />

      {/* Create / Edit Modal */}
      <WorkOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingWorkOrder={editingWo}
      />

      {/* Details View Modal */}
      <WorkOrderDetailModal
        isOpen={Boolean(viewingWo)}
        onClose={() => setViewingWo(null)}
        workOrder={viewingWo}
        onEdit={handleEdit}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Delete Work Order?"
        message="Are you sure you want to delete this Work Order? Associated agreements or bills in the current session will remain intact."
        confirmText="Confirm Delete"
      />
    </div>
  );
}
