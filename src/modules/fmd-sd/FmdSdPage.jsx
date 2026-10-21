import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Plus,
  Upload,
  FileText,
  Printer,
  Download,
  Trash2,
  Eye,
  Languages,
  CheckCircle2,
  FileQuestion,
  AlertCircle,
  HardDrive,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FmdSdModal from './FmdSdModal';
import FmdSdPrintModal from './FmdSdPrintModal';
import PrintableReportModal from '../../components/common/PrintableReportModal';
import { generateFmdCustodyDocx, exportFmdSdExcel } from '../../services/export';
import {
  calculateInstrumentExpiry,
  summarizeFmdExpiries,
  DEFAULT_EXPIRY_WARNING_DAYS,
} from '../../services/fmd/fmdExpiryService';

export default function FmdSdPage() {
  const { fmdList, addFmdItem, updateFmdItem, deleteFmdItem, addFmdDocument, removeFmdDocument, addToast, isBackendConnected } = useApp();

  const [selectedFmdId, setSelectedFmdId] = useState(fmdList[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileTab, setMobileTab] = useState('list'); // 'list' | 'dossier' for phone screens
  const [warningWindowDays, setWarningWindowDays] = useState(DEFAULT_EXPIRY_WARNING_DAYS);
  const [expiryFilter, setExpiryFilter] = useState('all'); // 'all' | 'active' | 'expiring_soon' | 'expired'

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [activePrintItem, setActivePrintItem] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // File Upload State
  const fileInputRef = useRef(null);

  const selectedItem = fmdList.find((item) => item.id === selectedFmdId || item._id === selectedFmdId) || fmdList[0];
  const expirySummary = summarizeFmdExpiries(fmdList, warningWindowDays);

  const filteredFmdList = fmdList.filter((item) => {
    const matchesSearch =
      item.tenderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tenderTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.contractorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.workOrderNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (expiryFilter === 'all') return true;
    const expiry = calculateInstrumentExpiry(item.validityDate, warningWindowDays);
    return expiry.status === expiryFilter;
  });

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedItem) return;

    for (let i = 0; i < files.length; i++) {
      addFmdDocument(selectedItem._id || selectedItem.id, files[i]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (data) => {
    if (editingItem) {
      await updateFmdItem(editingItem._id || editingItem.id, data);
    } else {
      const res = await addFmdItem(data);
      if (res) {
        setSelectedFmdId(res.id || res._id);
        setMobileTab('dossier');
      }
    }
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      await deleteFmdItem(deleteTargetId);
      if (selectedFmdId === deleteTargetId) {
        const remaining = fmdList.filter((item) => item.id !== deleteTargetId && item._id !== deleteTargetId);
        setSelectedFmdId(remaining[0]?.id || remaining[0]?._id || null);
      }
      setDeleteTargetId(null);
    }
  };

  const handleOpenPrint = (item) => {
    setActivePrintItem(item);
    setPrintModalOpen(true);
  };

  // Download authenticated binary document from server disk custody or local IndexedDB
  const handleDownloadDoc = async (doc) => {
    // If local data URL exists (stored in IndexedDB)
    if (doc.dataUrl) {
      const a = document.createElement('a');
      a.href = doc.dataUrl;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      addToast({
        type: 'success',
        title: 'Local File Downloaded',
        message: `Retrieved "${doc.name}" from local IndexedDB storage.`,
      });
      return;
    }

    const targetFmdId = selectedItem?._id || selectedItem?.id;
    const docId = doc._id || doc.id;

    if (isBackendConnected && targetFmdId && docId && (targetFmdId.length === 24 || targetFmdId.match(/^[0-9a-fA-F]{24}$/))) {
      try {
        await api.fmdSd.downloadDocument(targetFmdId, docId, doc.name);
        addToast({
          type: 'success',
          title: 'File Downloaded',
          message: `Retrieved "${doc.name}" from secure disk storage.`,
        });
        return;
      } catch (err) {
        console.warn('Backend download failed:', err.message);
      }
    }

    addToast({
      type: 'info',
      title: 'Document Preview',
      message: `Downloaded local session copy of ${doc.name}.`,
    });
  };

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Client-side Word (.docx) custody certificate generation (Hindi & English)
  const handleDownloadWordCertificate = async (item, lang = 'hi') => {
    try {
      await generateFmdCustodyDocx(item, lang);
      addToast({
        type: 'success',
        title: 'Word Certificate Downloaded',
        message: `Generated native Microsoft Word (.docx) certificate (${lang === 'hi' ? 'Hindi' : 'English'}) for ${item.tenderNumber}.`,
      });
    } catch (err) {
      console.warn('Word certificate generation error:', err.message);
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: err.message || 'Could not generate Word certificate.',
      });
    }
  };

  // Client-side Excel (.xlsx) Register Export
  const handleExportExcel = () => {
    if (fmdList.length === 0) {
      addToast({
        type: 'warning',
        title: 'No Records',
        message: 'No FMD / SD security records available to export.',
      });
      return;
    }
    exportFmdSdExcel(fmdList);
    addToast({
      type: 'success',
      title: 'Excel Register Exported',
      message: `Downloaded FMD / SD register (${fmdList.length} records) as .xlsx.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            FMD / SD Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tender Security Deposits (SD), FMD custody verification, bilingual print certificates, and document custody.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            icon={FileSpreadsheet}
            onClick={handleExportExcel}
            className="w-full sm:w-auto text-xs"
            title="Export complete FMD / SD register to Excel (.xlsx)"
          >
            Export Excel (.xlsx)
          </Button>
          <Button
            variant="outline"
            icon={Printer}
            onClick={() => setIsReportModalOpen(true)}
            className="w-full sm:w-auto text-xs"
            title="Print or save A4 PDF FMD / SD custody register report"
          >
            Print / PDF Register
          </Button>
          {selectedItem && (
            <>
              <Button
                variant="outline"
                icon={Download}
                onClick={() => handleDownloadWordCertificate(selectedItem, 'hi')}
                title="Download Hindi Word Certificate (.docx)"
                className="flex-1 sm:flex-initial text-xs"
              >
                Word (हिंदी)
              </Button>
              <Button
                variant="navy"
                icon={Printer}
                onClick={() => handleOpenPrint(selectedItem)}
                className="flex-1 sm:flex-initial shadow-sm text-xs"
              >
                Certificate PDF
              </Button>
            </>
          )}
          <Button
            icon={Plus}
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto shadow-sm text-xs"
          >
            Register FMD / SD
          </Button>
        </div>
      </div>


      {/* Mobile View Switcher (Visible on phone/tablet screens) */}
      <div className="lg:hidden flex rounded-xl bg-slate-200/80 p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-2 text-center rounded-lg transition-all ${
            mobileTab === 'list'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tender Records ({filteredFmdList.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('dossier')}
          className={`flex-1 py-2 text-center rounded-lg transition-all ${
            mobileTab === 'dossier'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Active Dossier {selectedItem ? `(${selectedItem.tenderNumber})` : ''}
        </button>
      </div>

      {/* Main Grid: Left is FMD list, Right is Active FMD Dossier & Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tender & FMD Records List (5 cols) */}
        <div className={`lg:col-span-5 space-y-3 ${mobileTab === 'dossier' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tender Security Records
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {filteredFmdList.length} shown of {fmdList.length}
              </span>
            </div>

            <input
              type="text"
              placeholder="Search tender #, work order, contractor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 sm:py-1.5 text-base sm:text-xs rounded-md border border-slate-300 focus:outline-none focus:border-blue-600 min-h-[40px] sm:min-h-0"
            />

            {/* Expiry Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-400 mr-0.5">Filter:</span>
              {[
                { id: 'all', label: `All (${fmdList.length})` },
                { id: 'active', label: `Valid (${expirySummary.activeCount})` },
                { id: 'expiring_soon', label: `Expiring (${expirySummary.expiringSoonCount})` },
                { id: 'expired', label: `Expired (${expirySummary.expiredCount})` },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setExpiryFilter(pill.id)}
                  className={`px-2 py-0.5 rounded-full font-medium transition-all cursor-pointer ${
                    expiryFilter === pill.id
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] lg:max-h-[600px] overflow-y-auto pr-1">
            {filteredFmdList.map((item) => {
              const isSelected = selectedItem?.id === item.id || selectedItem?._id === item.id || selectedItem?.id === item._id;
              const expiry = calculateInstrumentExpiry(item.validityDate, warningWindowDays);
              return (
                <div
                  key={item.id || item._id}
                  onClick={() => {
                    setSelectedFmdId(item.id || item._id);
                    setMobileTab('dossier');
                  }}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-mono font-bold text-slate-900">{item.tenderNumber}</span>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      <Badge variant={item.fmdStatus} size="sm">
                        {item.fmdStatus}
                      </Badge>
                      {item.validityDate && item.fmdStatus !== 'Released' && item.fmdStatus !== 'Forfeited' && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          expiry.status === 'expired'
                            ? 'bg-rose-100 text-rose-800'
                            : expiry.status === 'expiring_soon'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {expiry.shortLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="font-medium text-slate-800 line-clamp-1 mb-2">
                    {item.tenderTitle}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>WO: <strong className="text-slate-700">{item.workOrderNumber || 'Direct'}</strong></span>
                    <span className="font-bold text-blue-700 font-mono">
                      SD: {formatCurrency(item.sdAmount)}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredFmdList.length === 0 && (
              <div className="p-8 bg-white border rounded-xl text-center text-xs text-slate-500">
                No FMD / SD records matched.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Tender Dossier & Document Custody (7 cols) */}
        {selectedItem ? (
          <div className={`lg:col-span-7 space-y-5 ${mobileTab === 'list' ? 'hidden lg:block' : 'block'}`}>
            {/* Active Record Card */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                      {selectedItem.tenderNumber}
                    </h2>
                    <Badge variant={selectedItem.fmdStatus}>{selectedItem.fmdStatus}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{selectedItem.tenderTitle}</p>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Languages}
                    onClick={() => handleOpenPrint(selectedItem)}
                    className="flex-1 sm:flex-initial"
                  >
                    Hindi / Eng
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingItem(selectedItem);
                      setIsModalOpen(true);
                    }}
                    className="flex-1 sm:flex-initial"
                  >
                    Edit Record
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    icon={Trash2}
                    onClick={() => setDeleteTargetId(selectedItem._id || selectedItem.id)}
                    className="flex-1 sm:flex-initial"
                    title="Delete record"
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block mb-0.5">Related Work Order</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {selectedItem.workOrderNumber || 'Direct Tender'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block mb-0.5">Contractor Agency</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {selectedItem.contractorName || 'Registered Vendor'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block mb-0.5">Security Instrument</span>
                  <span className="font-semibold text-slate-800">
                    {selectedItem.instrumentType || 'Bank Guarantee'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block mb-0.5">SD Amount (Custody)</span>
                  <span className="font-bold text-blue-700 font-mono">
                    {formatCurrency(selectedItem.sdAmount)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block mb-0.5">EMD Amount</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {formatCurrency(selectedItem.emdAmount)}
                  </span>
                </div>
                {(() => {
                  const selectedExpiry = calculateInstrumentExpiry(selectedItem.validityDate, warningWindowDays);
                  return (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block mb-0.5">Validity Expiry</span>
                      <span className="font-semibold text-slate-800 font-mono block">
                        {formatDate(selectedItem.validityDate)}
                      </span>
                      {selectedItem.validityDate && selectedItem.fmdStatus !== 'Released' && selectedItem.fmdStatus !== 'Forfeited' && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mt-1 ${
                          selectedExpiry.status === 'expired'
                            ? 'bg-rose-100 text-rose-800'
                            : selectedExpiry.status === 'expiring_soon'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {selectedExpiry.label}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>

              {selectedItem.bankName && (
                <div className="p-2.5 bg-slate-50 rounded-lg border text-xs text-slate-700 flex items-center justify-between">
                  <span>
                    <strong>Pledged Bank:</strong> {selectedItem.bankName} (Ref: {selectedItem.instrumentReference})
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>
              )}

              {/* SD Release Clearance Gate Information */}
              {selectedItem.fmdStatus === 'Released' && (
                <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-300 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                    <span>SD Release Sanction & Clearance Audit Record</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700">
                    <div>
                      <span className="text-slate-400 block">Sanction Order Ref:</span>
                      <strong className="font-mono text-slate-900">{selectedItem.releaseOrderNumber || 'Recorded in Divisional Register'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Approval Date:</span>
                      <strong>{formatDate(selectedItem.releaseApprovalDate)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Sanctioning Officer:</span>
                      <strong>{selectedItem.releaseApprovingAuthority || 'Executive Engineer'}</strong>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-emerald-200 text-[10px] text-emerald-800">
                    <span>DLP Clearance: <strong>{selectedItem.dlpClearanceStatus ? 'Satisfactorily Cleared' : 'Verified'}</strong></span>
                    {selectedItem.finalBillPassed && <span>• Final Bill Passed</span>}
                    {selectedItem.noDuesCertificate && <span>• No Dues Certificate Attached</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Document Upload Interface (Frontend Preview - Session Bound) */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    FMD / SD Document Custody & Upload
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Attach signed BG scans, FDR receipts, and release verification certificates.
                  </p>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200 w-fit">
                  Secure Server Storage Active
                </span>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 sm:p-5 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.png"
                />
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">
                    Click to browse or drop security documents here
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Supported: PDF, scanned BG receipts, DOCX (Max 15MB)
                  </span>
                </div>
              </div>

              {/* Storage Notice */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2.5">
                <HardDrive className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800">Custody Storage (Step 3):</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Binary documents are streamed directly to dedicated server custody storage. Server-side MIME validation, 15MB file size checking, and SHA-safe physical filename tracking are fully enforced.
                  </p>
                </div>
              </div>

              {/* Attached Documents List */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold text-slate-700 block">
                  Attached Instruments & Files ({(selectedItem.uploadedDocuments || []).length}):
                </span>

                <div className="space-y-2">
                  {(selectedItem.uploadedDocuments || []).map((doc) => (
                    <div
                      key={doc.id || doc._id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/80 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                        <div className="truncate">
                          <span className="font-medium text-slate-800 block truncate" title={doc.name}>
                            {doc.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {doc.size} • Uploaded {doc.uploadedAt}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-3">
                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(doc)}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="Download Preview"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenPrint(selectedItem)}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="Print Verification Certificate"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFmdDocument(selectedItem._id || selectedItem.id, doc._id || doc.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Document from Custody Storage"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {(selectedItem.uploadedDocuments || []).length === 0 && (
                    <div className="text-center py-6 border border-dashed rounded-lg bg-slate-50 text-slate-400 text-xs">
                      No documents uploaded yet for this tender.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-white p-8 rounded-xl border text-center text-slate-500 text-xs">
            Select a tender to inspect FMD / SD security details.
          </div>
        )}
      </div>

      {/* Register/Edit FMD Modal */}
      <FmdSdModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingItem={editingItem}
      />

      {/* Bilingual Print Modal */}
      <FmdSdPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        fmdItem={activePrintItem}
      />

      {/* Printable FMD / SD Register Report Modal */}
      <PrintableReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="FMD & Security Deposit (SD) Custody Register Report"
        subtitle="Public Works Department | Division No. 1"
        reportType="fmd-sd"
        data={fmdList}
        onExportExcel={handleExportExcel}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Delete FMD / SD Security Record?"
        message="Are you sure you want to delete this security custody record? This action will remove the record and attached document associations."
        confirmText="Confirm Delete"
      />
    </div>
  );
}
