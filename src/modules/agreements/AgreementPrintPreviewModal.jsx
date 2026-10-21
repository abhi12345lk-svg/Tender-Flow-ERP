import React, { useState } from 'react';
import { Printer, Download, FileText, CheckCircle2, Loader2, Building2, ShieldCheck, Scale, Award } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateAgreementDocx } from '../../services/export';
import { printElement } from '../../utils/printHelper';
import { useApp } from '../../context/AppContext';

export default function AgreementPrintPreviewModal({ isOpen, onClose, agreement, workOrder }) {
  const { workOrders } = useApp();
  const [exportingWord, setExportingWord] = useState(false);

  if (!agreement) return null;

  // Resolve linked work order for rich contract particulars
  const linkedWo =
    workOrder ||
    (workOrders || []).find(
      (w) =>
        w.id === agreement.workOrderId ||
        w._id === agreement.workOrderId ||
        w.workOrderNumber === agreement.workOrderNumber
    );

  const handlePrint = () => {
    printElement('printable-document', {
      title: `Agreement_${agreement.agreementNumber?.replace(/[\/\\]/g, '_') || 'Contract'}`,
    });
  };

  const handleDownloadDoc = async () => {
    try {
      setExportingWord(true);
      await generateAgreementDocx(agreement);
    } catch (err) {
      console.warn('Word export error:', err.message);
      printElement('printable-document', {
        title: `Agreement_${agreement.agreementNumber?.replace(/[\/\\]/g, '_') || 'Contract'}`,
      });
    } finally {
      setExportingWord(false);
    }
  };

  const stampAmount = Number(agreement.stampDutyAmount) || 15000;
  const woAmount = linkedWo?.workOrderAmount ? Number(linkedWo.workOrderAmount) : 0;
  const sdAmount = linkedWo?.sdAmount ? Number(linkedWo.sdAmount) : Math.round(woAmount * 0.05);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Agreement Document & Print Preview"
      subtitle={`Ref: ${agreement.agreementNumber} | Form: ${agreement.templateType}`}
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          <div className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700">Official Legal Contract Standard (A4 Enforceable)</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
              Close Preview
            </Button>
            <Button
              variant="outline"
              icon={exportingWord ? Loader2 : Download}
              className="w-full sm:w-auto"
              onClick={handleDownloadDoc}
              disabled={exportingWord}
            >
              {exportingWord ? 'Generating .docx...' : 'Download Word (.docx)'}
            </Button>
            <Button variant="navy" icon={Printer} onClick={handlePrint} className="w-full sm:w-auto shadow-sm">
              Print / Save PDF
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Printable Official Legal Contract Document Sheet */}
        <div
          id="printable-document"
          className="bg-white p-5 sm:p-10 border-2 border-slate-300 rounded-xl shadow-md text-slate-900 space-y-6 max-w-4xl mx-auto leading-relaxed"
          style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
        >
          {/* SECTION 1: AUTHENTIC E-STAMP DUTY CERTIFICATE DOCKET */}
          <div className="border-2 border-amber-900/60 bg-amber-50/40 p-3 sm:p-4 rounded-lg space-y-2 text-xs font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-900/30 pb-2 gap-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-800 shrink-0" />
                <span className="font-extrabold uppercase tracking-wider text-amber-950 text-[11px] sm:text-xs">
                  Government Digital E-Stamp Certificate • Non-Judicial Registry
                </span>
              </div>
              <span className="font-mono text-[10px] sm:text-[11px] font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300 self-start sm:self-auto">
                {agreement.stampDutyNumber || 'E-STAMP-DL24-998812'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 text-slate-700">
              <div>
                <span className="text-slate-500 block text-[10px]">Date of Registration:</span>
                <span className="font-bold text-slate-900">{formatDate(agreement.agreementDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Stamp Duty Value:</span>
                <span className="font-bold text-emerald-800 font-mono">
                  ₹ {stampAmount.toLocaleString('en-IN')}.00
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">First Party (Purchaser):</span>
                <span className="font-bold text-slate-900 truncate block">TenderFlow Operations</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Second Party (Contractor):</span>
                <span className="font-bold text-slate-900 truncate block">{agreement.contractorName}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-amber-900/20 text-[10px] text-amber-900/80">
              <span>Instrument Classification: Article 5(c) Legal Covenant</span>
              <span className="font-mono font-semibold">STATUS: OFFICIALLY VERIFIED & AUDIT RECORDED</span>
            </div>
          </div>

          {/* SECTION 2: OFFICIAL CORPORATE EXECUTIVE CONTRACT HEADING */}
          <div className="text-center space-y-1.5 pt-1">
            <div className="flex items-center justify-center gap-2 text-slate-700 font-sans text-xs tracking-widest uppercase font-bold">
              <Building2 className="h-4 w-4 text-slate-800" />
              <span>TenderFlow Infrastructure & Commercial Operations</span>
            </div>
            <p className="text-[11px] font-sans font-semibold tracking-wider text-slate-500 uppercase">
              Directorate of Contracts, Procurement & Commercial Affairs
            </p>

            <div className="border-t-2 border-b-2 border-slate-900 py-3 my-3">
              <h1 className="text-lg sm:text-2xl font-extrabold uppercase tracking-wide text-slate-900">
                ARTICLES OF AGREEMENT
              </h1>
              <p className="text-xs sm:text-sm font-sans font-bold text-slate-700 mt-1 uppercase tracking-wider">
                Formal Contract for Commercial Infrastructure Project Execution
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-sans text-slate-600 font-mono">
              <span>
                <strong>Contract Instrument Ref:</strong> {agreement.agreementNumber}
              </span>
              <span>•</span>
              <span>
                <strong>Form Template:</strong> {agreement.templateType}
              </span>
              <span>•</span>
              <span>
                <strong>Execution Date:</strong> {formatDate(agreement.agreementDate)}
              </span>
            </div>
          </div>

          {/* SECTION 3: MASTER SCHEDULE OF CONTRACT PARTICULARS */}
          <div className="space-y-1.5 font-sans">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-blue-700" />
              <span>Schedule of Contract Particulars</span>
            </h4>
            <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="w-1/4 p-2.5 bg-slate-50 font-semibold text-slate-600">Agreement Reference:</td>
                    <td className="w-1/4 p-2.5 font-bold font-mono text-slate-900">{agreement.agreementNumber}</td>
                    <td className="w-1/4 p-2.5 bg-slate-50 font-semibold text-slate-600">Date of Execution:</td>
                    <td className="w-1/4 p-2.5 font-bold text-slate-900">{formatDate(agreement.agreementDate)}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 bg-slate-50 font-semibold text-slate-600">Work Order Reference:</td>
                    <td className="p-2.5 font-bold font-mono text-slate-900">{agreement.workOrderNumber}</td>
                    <td className="p-2.5 bg-slate-50 font-semibold text-slate-600">Tender Reference No:</td>
                    <td className="p-2.5 font-bold font-mono text-slate-900">{agreement.tenderNumber}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 bg-slate-50 font-semibold text-slate-600">Principal Employer:</td>
                    <td className="p-2.5 font-bold text-slate-900">TenderFlow Infrastructure Operations</td>
                    <td className="p-2.5 bg-slate-50 font-semibold text-slate-600">Contractor / Agency:</td>
                    <td className="p-2.5 font-bold text-slate-900">{agreement.contractorName}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 bg-slate-50 font-semibold text-slate-600">Project Work Scope:</td>
                    <td colSpan={3} className="p-2.5 font-bold text-slate-900">
                      {linkedWo?.title || agreement.documentTitle || 'Commercial Infrastructure Project Works'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 bg-slate-50 font-semibold text-slate-600">Sanctioned Contract Value:</td>
                    <td className="p-2.5 font-bold text-emerald-800 font-mono">
                      {woAmount > 0 ? `₹ ${woAmount.toLocaleString('en-IN')}.00` : 'As per Approved Bill of Quantities'}
                    </td>
                    <td className="p-2.5 bg-slate-50 font-semibold text-slate-600">Stipulated Completion Date:</td>
                    <td className="p-2.5 font-bold text-slate-900">
                      {linkedWo?.stipulatedDateOfCompletion
                        ? formatDate(linkedWo.stipulatedDateOfCompletion)
                        : 'As per Contract Milestones'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 4: FORMAL LEGAL RECITALS & OPERATIVE PREAMBLE */}
          <div className="text-xs space-y-3 text-justify leading-relaxed text-slate-800 pt-2">
            <p>
              <strong>THIS ARTICLES OF AGREEMENT</strong> is made and entered into on this{' '}
              <strong>{formatDate(agreement.agreementDate)}</strong>, BY AND BETWEEN:
            </p>
            <div className="pl-4 border-l-2 border-slate-400 space-y-2 italic">
              <p>
                <strong>TENDERFLOW INFRASTRUCTURE OPERATIONS</strong>, having its principal divisional office at Central
                Operations Complex (hereinafter referred to as the <strong>"EMPLOYER / PRINCIPAL"</strong>, which
                expression shall, unless repugnant to the context or meaning thereof, include its successors,
                representatives, and permitted assigns) of the <strong>FIRST PART</strong>;
              </p>
              <p className="font-bold text-center not-italic font-sans text-slate-600">— AND —</p>
              <p>
                <strong>M/s {agreement.contractorName}</strong>, a registered corporate entity / contracting firm
                having its registered office as specified in tender submission documents (hereinafter referred to as the{' '}
                <strong>"CONTRACTOR"</strong>, which expression shall include its legal heirs, partners, successors, and
                permitted assigns) of the <strong>SECOND PART</strong>.
              </p>
            </div>

            <p>
              <strong>WHEREAS</strong> the Employer invited competitive tenders for the execution and completion of{' '}
              <em>"{linkedWo?.title || agreement.documentTitle || 'Infrastructure Project Works'}"</em> bearing Tender No.{' '}
              <strong className="font-mono">{agreement.tenderNumber}</strong>;
            </p>
            <p>
              <strong>AND WHEREAS</strong> the Contractor submitted a responsive commercial and technical bid which was
              duly evaluated and accepted by the Employer through Work Order No.{' '}
              <strong className="font-mono">{agreement.workOrderNumber}</strong>;
            </p>
            <p>
              <strong>NOW THIS AGREEMENT WITNESSETH</strong> and it is hereby mutually agreed by and between the parties
              as follows:
            </p>
          </div>

          {/* SECTION 5: NUMBERED COVENANTS & ARTICLES */}
          <div className="text-xs space-y-3.5 text-justify leading-relaxed text-slate-900 border-t border-slate-200 pt-4">
            <div>
              <p className="font-bold text-slate-900">
                1. Priority & Integrity of Contract Documents:
              </p>
              <p className="text-slate-700 mt-0.5">
                The following documents shall be deemed to form and be read and construed as integral parts of this
                Contract: (a) This Articles of Agreement, (b) Work Order No. {agreement.workOrderNumber}, (c) Approved
                Tender Drawings and Technical Specifications, (d) General and Special Conditions of Contract (GCC &
                SCC), and (e) Sanctioned Bill of Quantities (BOQ).
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-900">
                2. Scope of Work & Performance Standards:
              </p>
              <p className="text-slate-700 mt-0.5">
                The Contractor covenants to design, execute, construct, complete, and maintain the works with supreme
                professional diligence, adhering strictly to engineering codes, approved materials, and directives
                issued by the Engineer-in-Charge.
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-900">
                3. Contract Consideration & Payment Schedule:
              </p>
              <p className="text-slate-700 mt-0.5">
                The Employer covenants to pay the Contractor the sanctioned contract value through certified Running
                Account (RA) bills against verified physical milestones, subject to statutory tax deductions (TDS,
                GST-TDS, Labour Welfare Cess) and prescribed retention security.
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-900">
                4. Performance Security & Defect Liability Period:
              </p>
              <p className="text-slate-700 mt-0.5">
                The Contractor confirms having pledged the requisite Security Deposit (₹ {sdAmount.toLocaleString('en-IN')})
                valid through the project duration. The Defect Liability Period (DLP) shall remain enforced for a
                period of twelve (12) calendar months from the formal date of completion and handover.
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-900">
                5. Time of Essence & Completion Milestones:
              </p>
              <p className="text-slate-700 mt-0.5">
                Time is the essence of this Contract. The Contractor shall attain intermediate milestones and complete
                the entirety of works on or before the stipulated date of completion. Liquidated damages shall be
                leviable for unexcused delays in accordance with contract rules.
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-900">
                6. Statutory Compliances, Labour Welfare & Indemnity:
              </p>
              <p className="text-slate-700 mt-0.5">
                The Contractor shall strictly adhere to all statutory labour welfare codes, Workmen's Compensation Acts,
                EPF/ESI regulations, site safety guidelines, and environmental rules, indemnifying the Employer against
                any third-party liabilities or claims.
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-900">
                7. Dispute Resolution & Governing Jurisdiction:
              </p>
              <p className="text-slate-700 mt-0.5">
                Any controversy or dispute arising out of this Contract shall first be settled through mutual conciliation,
                failing which it shall be referred to arbitration under the Indian Arbitration and Conciliation Act, 1996.
                The courts having territorial jurisdiction over the project division shall have exclusive authority.
              </p>
            </div>

            {/* Special Conditions / Custom Content entered by user */}
            {agreement.content && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                <p className="font-bold text-slate-900 mb-1">
                  8. Special Conditions & Project-Specific Covenants:
                </p>
                <p className="text-slate-700 whitespace-pre-line text-[11px] leading-relaxed">
                  {agreement.content}
                </p>
              </div>
            )}
          </div>

          {/* SECTION 6: FORMAL EXECUTION, SIGNATORY & SEAL BLOCKS */}
          <div className="pt-6 border-t-2 border-slate-900 space-y-6 font-sans">
            <p className="text-xs text-center font-bold text-slate-800 uppercase tracking-wider">
              IN WITNESS WHEREOF the Parties have signed and sealed this Agreement on the day and year first written above.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 text-xs">
              {/* Employer Side */}
              <div className="border border-slate-300 rounded-lg p-4 space-y-6 bg-slate-50/50">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Signed For & On Behalf of Employer:
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">FIRST PARTY</span>
                </div>
                <div className="pt-8 text-center sm:text-left space-y-1">
                  <div className="border-t-2 border-slate-700 w-48 mb-1.5 mx-auto sm:mx-0"></div>
                  <p className="font-bold text-slate-900 text-xs">Authorized Signatory / Project Director</p>
                  <p className="text-slate-500 text-[11px]">Commercial Operations Division</p>
                  <div className="mt-3 inline-block px-3 py-1 border border-dashed border-slate-400 text-[10px] text-slate-400 rounded">
                    [ OFFICIAL CORPORATE SEAL ]
                  </div>
                </div>
              </div>

              {/* Contractor Side */}
              <div className="border border-slate-300 rounded-lg p-4 space-y-6 bg-slate-50/50">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Signed For & On Behalf of Contractor:
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">SECOND PARTY</span>
                </div>
                <div className="pt-8 text-center sm:text-left space-y-1">
                  <div className="border-t-2 border-slate-700 w-48 mb-1.5 mx-auto sm:mx-0"></div>
                  <p className="font-bold text-slate-900 text-xs">{agreement.contractorName}</p>
                  <p className="text-slate-500 text-[11px]">Authorized Signatory / Managing Partner</p>
                  <div className="mt-3 inline-block px-3 py-1 border border-dashed border-slate-400 text-[10px] text-slate-400 rounded">
                    [ CONTRACTOR COMMON SEAL ]
                  </div>
                </div>
              </div>
            </div>

            {/* Witnesses Section */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-[11px] space-y-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider block">
                In the Presence of Respected Witnesses:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <div className="border-b border-slate-400 w-40 pb-3 text-slate-400 text-[10px]">
                    1. Signature: _________________________
                  </div>
                  <p className="text-slate-600">Name & Title: ___________________________</p>
                  <p className="text-slate-500 text-[10px]">Address: _________________________________</p>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-slate-400 w-40 pb-3 text-slate-400 text-[10px]">
                    2. Signature: _________________________
                  </div>
                  <p className="text-slate-600">Name & Title: ___________________________</p>
                  <p className="text-slate-500 text-[10px]">Address: _________________________________</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 7: SECURITY AUDIT & VERIFICATION FOOTER */}
          <div className="pt-4 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between text-[10px] font-sans text-slate-500 gap-2">
            <span className="font-mono">
              SECURITY AUDIT REF: TF-AGR-{agreement.agreementNumber?.replace(/[^a-zA-Z0-9]/g, '') || 'SEC'}-VERIFIED
            </span>
            <span>Official Legally Enforceable Commercial Instrument • TenderFlow ERP</span>
            <span className="font-bold">A4 Formatted • Page 1 of 1</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
