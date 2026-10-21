import React, { useState } from 'react';
import {
  Plus,
  FileSignature,
  Printer,
  FileText,
  Download,
  Edit2,
  Trash2,
  FileCode,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate, formatCurrency } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AgreementModal from './AgreementModal';
import AgreementPrintPreviewModal from './AgreementPrintPreviewModal';
import PrintableReportModal from '../../components/common/PrintableReportModal';
import { generateAgreementDocx, exportAgreementsExcel } from '../../services/export';

export default function AgreementsPage() {
  const { agreements, addAgreement, updateAgreement, deleteAgreement, workOrders, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [templateFilter, setTemplateFilter] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState(null);
  const [previewAgreement, setPreviewAgreement] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const filteredAgreements = agreements.filter((agr) => {
    const matchesSearch =
      agr.agreementNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agr.workOrderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agr.contractorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agr.templateType?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTemplate = templateFilter === 'ALL' || agr.templateType === templateFilter;
    return matchesSearch && matchesTemplate;
  });

  const handleCreateNew = () => {
    if (workOrders.length === 0) {
      addToast({
        type: 'warning',
        title: 'Work Order Required',
        message: 'Please create at least one Work Order before drafting an Agreement.',
      });
      return;
    }
    setEditingAgreement(null);
    setIsModalOpen(true);
  };

  const handleEdit = (agr) => {
    setEditingAgreement(agr);
    setIsModalOpen(true);
  };

  const handleSave = (data) => {
    if (editingAgreement) {
      updateAgreement(editingAgreement.id, data);
    } else {
      addAgreement(data);
    }
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteAgreement(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Client-side Word Document (.docx) Export using docx
  const handleWordExport = async (agr) => {
    try {
      await generateAgreementDocx(agr);
      addToast({
        type: 'success',
        title: 'Word Document Downloaded',
        message: `Generated native Microsoft Word (.docx) contract for ${agr.agreementNumber}.`,
      });
    } catch (err) {
      console.warn('Word export failed:', err.message);
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: err.message || 'Could not generate Word document.',
      });
    }
  };

  // Client-side Excel (.xlsx) Register Export
  const handleExportExcel = () => {
    if (filteredAgreements.length === 0) {
      addToast({
        type: 'warning',
        title: 'No Records',
        message: 'No agreement records available to export.',
      });
      return;
    }
    exportAgreementsExcel(filteredAgreements);
    addToast({
      type: 'success',
      title: 'Excel Register Exported',
      message: `Downloaded agreements register (${filteredAgreements.length} records) as .xlsx.`,
    });
  };

  const columns = [
    {
      header: 'Agreement Number',
      key: 'agreementNumber',
      render: (val, row) => (
        <div>
          <button
            onClick={() => setPreviewAgreement(row)}
            className="font-bold text-blue-700 hover:text-blue-900 font-mono text-xs hover:underline text-left block"
          >
            {val}
          </button>
          <span className="text-[11px] text-slate-500 font-mono">Date: {formatDate(row.agreementDate)}</span>
        </div>
      ),
    },
    {
      header: 'Related Work Order & Tender',
      key: 'workOrderNumber',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-900 font-mono text-xs block">{val}</span>
          <span className="text-[11px] text-slate-500 font-mono">Tender: {row.tenderNumber}</span>
        </div>
      ),
    },
    {
      header: 'Contractor / Agency',
      key: 'contractorName',
      render: (val) => (
        <span className="font-medium text-slate-800 text-xs block truncate max-w-xs" title={val}>
          {val}
        </span>
      ),
    },
    {
      header: 'Template Form',
      key: 'templateType',
      render: (val) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-700">
          <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span className="truncate max-w-[170px]" title={val}>{val}</span>
        </span>
      ),
    },
    {
      header: 'E-Stamp Duty',
      key: 'stampDutyAmount',
      align: 'right',
      render: (val, row) => (
        <div className="text-right">
          <span className="font-mono text-xs text-slate-800 font-medium">
            {formatCurrency(val)}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">
            {row.stampDutyNumber || 'No Stamp Ref'}
          </span>
        </div>
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
          {/* Print Preview Action */}
          <button
            onClick={() => setPreviewAgreement(row)}
            className="p-1.5 rounded text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition-colors"
            title="Print Preview / PDF Format"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>

          {/* Word Document Action */}
          <button
            onClick={() => handleWordExport(row)}
            className="p-1.5 rounded text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition-colors"
            title="Download Official Word Document (.doc)"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          {/* Edit Action */}
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 rounded text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition-colors"
            title="Edit Agreement & Clauses"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          {/* Delete Action */}
          <button
            onClick={() => setDeleteTargetId(row.id)}
            className="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Agreement"
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
            Agreement Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bind sanctioned Work Orders to legal contract templates, manage E-Stamp duty, and generate printable articles.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            icon={FileSpreadsheet}
            onClick={handleExportExcel}
            className="w-full sm:w-auto text-xs"
            title="Export agreements register to Excel (.xlsx)"
          >
            Export Excel (.xlsx)
          </Button>
          <Button
            variant="outline"
            icon={Printer}
            onClick={() => setIsReportModalOpen(true)}
            className="w-full sm:w-auto text-xs"
            title="Print or save A4 PDF agreement register report"
          >
            Print / PDF Register
          </Button>
          <Button icon={Plus} onClick={handleCreateNew} className="w-full sm:w-auto shadow-sm">
            New Agreement
          </Button>
        </div>
      </div>

      {/* Step 3 Workflow Scope Alert */}
      <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-xs text-emerald-900 flex items-start gap-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold">Step 3 Document Workflow Operational:</span>
          <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
            Legal contracts are dynamically linked to saved MongoDB Work Order records. Server-side Microsoft Word (.doc) document generation, browser print-to-PDF formatting, and bilingual clause rendering are fully integrated.
          </p>
        </div>
      </div>

      {/* Standard Templates Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileSignature className="h-4 w-4" />
          </div>
          <div className="truncate">
            <span className="font-semibold text-xs text-slate-800 block">Contract Form F-2</span>
            <span className="text-[10px] text-slate-400">Lump Sum Contract Standard</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="truncate">
            <span className="font-semibold text-xs text-slate-800 block">Item Rate Form B-1</span>
            <span className="text-[10px] text-slate-400">Schedule of Rates (SOR) Contracts</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="truncate">
            <span className="font-semibold text-xs text-slate-800 block">E-Stamp Duty Integration</span>
            <span className="text-[10px] text-slate-400">SHCIL / Treasury Verification</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search agreement #, work order, contractor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 px-3 py-2 sm:py-1.5 text-base sm:text-xs rounded-md border border-slate-300 focus:outline-none focus:border-blue-600 bg-white min-h-[40px] sm:min-h-0"
          />

          <select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 sm:py-1.5 text-base sm:text-xs rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-blue-600 min-h-[40px] sm:min-h-0 cursor-pointer"
          >
            <option value="ALL">All Template Forms</option>
            <option value="Standard PWD Contract Form F-2 (Lump Sum)">Standard Contract Form F-2 (Lump Sum)</option>
            <option value="Item Rate Agreement Form B-1">Item Rate Form B-1</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex items-center justify-between sm:justify-end">
          <span>Total agreements: <strong className="text-slate-800">{filteredAgreements.length}</strong></span>
          {(searchTerm || templateFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTemplateFilter('ALL');
              }}
              className="text-blue-600 hover:underline font-medium ml-2 sm:hidden"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Agreements Data Table */}
      <DataTable
        columns={columns}
        data={filteredAgreements}
        emptyTitle="No Agreements Found"
        emptyDescription="No contract agreements have been executed yet or none match your query."
        emptyActionLabel="New Agreement"
        onEmptyAction={handleCreateNew}
      />

      {/* Create / Edit Modal */}
      <AgreementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingAgreement={editingAgreement}
      />

      {/* Print Preview & PDF Modal */}
      <AgreementPrintPreviewModal
        isOpen={Boolean(previewAgreement)}
        onClose={() => setPreviewAgreement(null)}
        agreement={previewAgreement}
      />

      {/* Printable Register Report Modal */}
      <PrintableReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Official Contract Agreements Register Report"
        subtitle="Commercial Infrastructure Project & Contract Operations"
        reportType="agreements"
        data={filteredAgreements}
        onExportExcel={handleExportExcel}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Delete Agreement Entry?"
        message="Are you sure you want to delete this agreement? The associated Work Order will remain unaffected."
        confirmText="Confirm Delete"
      />
    </div>
  );
}
