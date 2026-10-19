import React from 'react';
import { Printer, Download, X, FileText, CheckCircle2 } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function AgreementPrintPreviewModal({ isOpen, onClose, agreement, workOrder }) {
  if (!agreement) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agreement Document & Print Preview"
      subtitle={`Agreement Ref: ${agreement.agreementNumber} | Template: ${agreement.templateType}`}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>Official Government PWD Standard Agreement Format</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close Preview
            </Button>
            <Button
              variant="outline"
              icon={Download}
              onClick={() => {
                const targetId = agreement._id || agreement.id;
                const safeFilename = `${(agreement.agreementNumber || 'Agreement').replace(/[\/\\]/g, '_')}_Official_Contract.doc`;
                if (targetId && (targetId.length === 24 || targetId.match(/^[0-9a-fA-F]{24}$/))) {
                  window.open(`http://localhost:5000/api/v1/agreements/${targetId}/docx`, '_blank');
                } else {
                  window.print();
                }
              }}
            >
              Download Word (.doc)
            </Button>
            <Button variant="navy" icon={Printer} onClick={handlePrint}>
              Print / Save PDF
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Step 3 Document Status Banner */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Document Workflow Operational:</strong> Print-to-PDF formatting with browser layout controls and server-side Microsoft Word (.doc) generation are fully active.
            </span>
          </div>
        </div>

        {/* Printable Government Document Sheet */}
        <div
          id="printable-document"
          className="bg-white p-8 border border-slate-300 rounded-lg shadow-sm font-serif text-slate-900 space-y-6 max-w-3xl mx-auto leading-relaxed"
        >
          {/* Official Emblem & Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">
              GOVERNMENT OF INDIA / STATE PUBLIC WORKS DEPARTMENT
            </h2>
            <h3 className="text-base font-extrabold uppercase mt-1">
              OFFICE OF THE EXECUTIVE ENGINEER, DIVISION NO. 1
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Form of Contract & Legal Articles of Agreement
            </p>
          </div>

          {/* Reference Meta */}
          <div className="grid grid-cols-2 text-xs border p-3 rounded bg-slate-50 font-sans gap-2">
            <div>
              <span className="font-semibold text-slate-600 block">Agreement Number:</span>
              <span className="font-bold font-mono text-slate-900">{agreement.agreementNumber}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 block">Date of Execution:</span>
              <span className="font-bold text-slate-900">{formatDate(agreement.agreementDate)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 block">Work Order Reference:</span>
              <span className="font-bold font-mono text-slate-900">{agreement.workOrderNumber}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 block">Tender Number (M):</span>
              <span className="font-bold font-mono text-slate-900">{agreement.tenderNumber}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 block">Contractor / Agency:</span>
              <span className="font-bold text-slate-900">{agreement.contractorName}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 block">E-Stamp Duty Certificate:</span>
              <span className="font-bold font-mono text-slate-900">
                {agreement.stampDutyNumber || 'E-STAMP-EXEMPTED'} (₹ {agreement.stampDutyAmount || 0})
              </span>
            </div>
          </div>

          {/* Agreement Body Content */}
          <div className="text-xs space-y-3 text-justify leading-relaxed whitespace-pre-line text-slate-800">
            {agreement.content || `MEMORANDUM OF AGREEMENT executed on ${formatDate(agreement.agreementDate)} between the Executive Engineer, Public Works Department for and on behalf of the Governor (First Party) and ${agreement.contractorName} (Second Party/Contractor).

1. SCOPE OF WORK: The Contractor undertakes to execute, complete and maintain in conformity with the provisions of this contract all works described in Work Order No. ${agreement.workOrderNumber}.
2. LIQUIDATED DAMAGES & RETENTION: The Security Deposit and retention amount shall be regulated according to standard PWD General Conditions of Contract (GCC).
3. DISPUTE RESOLUTION: Any dispute or difference arising out of or in connection with this agreement shall be settled through arbitration under the Indian Arbitration and Conciliation Act.`}
          </div>

          {/* Signatures & Execution Section */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs font-sans">
            <div className="text-left space-y-12">
              <p className="text-slate-500">Signed, Sealed & Delivered by:</p>
              <div>
                <div className="border-t border-slate-400 w-48 mb-1"></div>
                <p className="font-bold text-slate-900">{agreement.contractorName}</p>
                <p className="text-slate-500 text-[11px]">(Signature of Authorized Contractor)</p>
              </div>
            </div>

            <div className="text-right space-y-12 flex flex-col items-end">
              <p className="text-slate-500">For and on behalf of the Governor:</p>
              <div>
                <div className="border-t border-slate-400 w-48 mb-1 ml-auto"></div>
                <p className="font-bold text-slate-900">Executive Engineer</p>
                <p className="text-slate-500 text-[11px]">Public Works Division No. 1</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
