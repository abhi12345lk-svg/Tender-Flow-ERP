import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Printer, Languages, ShieldCheck, FileText, AlertCircle, Download, Loader2 } from 'lucide-react';
import { generateFmdCustodyDocx } from '../../services/export';

export default function FmdSdPrintModal({ isOpen, onClose, fmdItem }) {
  const [language, setLanguage] = useState('en'); // 'en' or 'hi'
  const [editableNotes, setEditableNotes] = useState('');
  const [exportingWord, setExportingWord] = useState(false);

  if (!fmdItem) return null;

  const handlePrint = () => {
    window.print();
  };

  const isHindi = language === 'hi';

  const handleDownloadWordDoc = async () => {
    const lang = isHindi ? 'hi' : 'en';
    try {
      setExportingWord(true);
      await generateFmdCustodyDocx(fmdItem, lang, editableNotes);
    } catch (err) {
      console.warn('Word certificate generation failed, fallback to print:', err.message);
      window.print();
    } finally {
      setExportingWord(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isHindi ? "FMD / SD सत्यापन एवं प्रारूप" : "FMD / SD Verification & Print Document"}
      subtitle={
        isHindi
          ? `निविदा संख्या: ${fmdItem.tenderNumber} | कार्य आदेश: ${fmdItem.workOrderNumber || 'लागू नहीं'}`
          : `Tender Ref: ${fmdItem.tenderNumber} | Work Order: ${fmdItem.workOrderNumber || 'N/A'}`
      }
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          {/* Language Selection Toggle */}
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Languages className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">Language:</span>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  !isHindi ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  isHindi ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिंदी (Hindi)
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
            <Button
              variant="outline"
              icon={exportingWord ? Loader2 : Download}
              className="w-full sm:w-auto"
              onClick={handleDownloadWordDoc}
              disabled={exportingWord}
            >
              {exportingWord
                ? (isHindi ? 'वर्ड (.docx) तैयार...' : 'Generating .docx...')
                : (isHindi ? 'वर्ड (.docx) डाउनलोड' : 'Download Word (.docx)')}
            </Button>
            <Button variant="navy" icon={Printer} onClick={handlePrint} className="w-full sm:w-auto shadow-sm">
              {isHindi ? 'मुद्रण / PDF सहेजें' : 'Print / Save PDF'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Step 3 Document Status Banner */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Bilingual FMD / SD Workflow Active:</strong> Hindi & English printable custody certificate and server-side Microsoft Word (.doc) generation with Unicode text rendering are operational.
            </span>
          </div>
        </div>

        {/* Printable Sheet */}
        <div
          id="printable-document"
          className="bg-white p-4 sm:p-8 border border-slate-300 rounded-lg shadow-sm font-serif text-slate-900 space-y-4 sm:space-y-6 max-w-3xl mx-auto leading-relaxed"
        >
          {/* Official Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-700">
              {isHindi
                ? 'लोक निर्माण विभाग (भवन एवं मार्ग)'
                : 'PUBLIC WORKS DEPARTMENT (GOVERNMENT OF STATE)'}
            </h2>
            <h3 className="text-sm sm:text-base font-extrabold uppercase mt-1">
              {isHindi
                ? 'सुरक्षा जमा (SD) एवं FMD सत्यापन तथा अभिरक्षा प्रमाण-पत्र'
                : 'SECURITY DEPOSIT (SD) & FMD VERIFICATION AND CUSTODY CERTIFICATE'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {isHindi
                ? 'कार्यालय कार्यपालक अभियंता, खंड-1 | प्रपत्र संख्या: PWD/FMD-SD/2024'
                : 'Office of the Executive Engineer, Division No. 1 | Form Ref: PWD/FMD-SD/2024'}
            </p>
          </div>

          {/* Reference Meta Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 text-xs border p-3 rounded bg-slate-50 font-sans gap-2">
            <div>
              <span className="font-semibold text-slate-600 block">
                {isHindi ? 'निविदा संख्या (Tender No):' : 'Tender Number (M):'}
              </span>
              <span className="font-bold font-mono text-slate-900">{fmdItem.tenderNumber}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 block">
                {isHindi ? 'कार्य आदेश संख्या:' : 'Related Work Order Reference:'}
              </span>
              <span className="font-bold font-mono text-slate-900">
                {fmdItem.workOrderNumber || 'Direct Tender Record'}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 block">
                {isHindi ? 'संवेदक / फर्म का नाम:' : 'Contractor / Agency Name:'}
              </span>
              <span className="font-bold text-slate-900">{fmdItem.contractorName}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 block">
                {isHindi ? 'FMD स्थिति:' : 'FMD Status:'}
              </span>
              <span className="font-bold text-slate-900">{fmdItem.fmdStatus}</span>
            </div>
          </div>

          {/* Instrument Valuation Details */}
          <div className="p-3 border rounded bg-white text-xs font-sans space-y-2">
            <h4 className="font-bold uppercase text-slate-800">
              {isHindi ? 'वित्तीय प्रतिभूति एवं FMD विवरण' : 'Financial Security & FMD Instrument Details'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-500 block text-[11px]">SD Amount</span>
                <span className="font-bold text-slate-900">{formatCurrency(fmdItem.sdAmount)}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-500 block text-[11px]">EMD Amount</span>
                <span className="font-bold text-slate-900">{formatCurrency(fmdItem.emdAmount)}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-500 block text-[11px]">
                  {isHindi ? 'प्रतिभूति प्रकार' : 'Instrument Type'}
                </span>
                <span className="font-bold text-slate-900">{fmdItem.instrumentType || 'Bank Guarantee / FDR'}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-slate-500 block text-[11px]">
                  {isHindi ? 'वैधता तिथि' : 'Validity Upto'}
                </span>
                <span className="font-bold text-slate-900">{formatDate(fmdItem.validityDate)}</span>
              </div>
            </div>
          </div>

          {/* Legal Certification Text (Bilingual) */}
          <div className="text-xs space-y-3 text-justify leading-relaxed text-slate-800">
            {isHindi ? (
              <>
                <p>
                  यह प्रमाणित किया जाता है कि संवेदक <strong>{fmdItem.contractorName}</strong> द्वारा कार्य 
                  "<em>{fmdItem.tenderTitle}</em>" (निविदा संख्या {fmdItem.tenderNumber}) के संबंध में प्रस्तुत 
                  की गई सुरक्षा जमा (SD) राशि <strong>{formatCurrency(fmdItem.sdAmount)}</strong> एवं FMD प्रपत्र 
                  विभागीय लेखा नियमों के अनुसार विधिवत जांच उपरांत विभागीय अभिरक्षा में सुरक्षित रखी गई है।
                </p>
                <p>
                  2. बैंक गारंटी / एफ.डी.आर. संख्या <strong>{fmdItem.instrumentReference || 'BG/FDR'}</strong> जारीकर्ता बैंक 
                  ({fmdItem.bankName || 'राष्ट्रीयकृत बैंक'}) से संपुष्टि (Confirmation) प्राप्त हो चुकी है।
                </p>
                <p>
                  3. कार्य के संतोषजनक समापन एवं दोष निवारण अवधि (Defect Liability Period) पूर्ण होने के उपरांत ही सक्षम 
                  अधिकारी की अनुमति से नियमानुसार विमुक्ति (Release) की कार्रवाई की जाएगी।
                </p>
              </>
            ) : (
              <>
                <p>
                  This is to certify that the Security Deposit (SD) amounting to <strong>{formatCurrency(fmdItem.sdAmount)}</strong> and 
                  the designated FMD instrument submitted by contractor <strong>{fmdItem.contractorName}</strong> for the work 
                  "<em>{fmdItem.tenderTitle}</em>" (Tender Ref: {fmdItem.tenderNumber}) has been verified and deposited under official departmental custody.
                </p>
                <p>
                  2. The instrument bearing reference <strong>{fmdItem.instrumentReference || 'BG/FDR'}</strong> issued by 
                  {fmdItem.bankName || 'Scheduled Commercial Bank'} has been verified through independent bank confirmation in accordance with PWD Financial Rules.
                </p>
                <p>
                  3. The aforementioned SD / FMD shall remain pledged and valid through the contract duration and defect liability period, and shall only be released upon formal sanction by the Executive Engineer.
                </p>
              </>
            )}
          </div>

          {/* Editable Document Entry Point Note */}
          <div className="no-print pt-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {isHindi ? 'अतिरिक्त टिप्पणी / आदेश प्रविष्टि (वैकल्पिक):' : 'Additional Officer Notes / Endorsement (Optional):'}
            </label>
            <input
              type="text"
              placeholder={isHindi ? "जैसे: बैंक से पुष्टिकरण पत्र दिनांक 12/06/2024 प्राप्त हुआ" : "e.g. Bank confirmation received on dispatch ref 441/Accts"}
              value={editableNotes}
              onChange={(e) => setEditableNotes(e.target.value)}
              className="w-full text-base sm:text-xs p-2 border border-slate-300 rounded focus:outline-none focus:border-blue-600 font-sans min-h-[40px] sm:min-h-0"
            />
          </div>

          {editableNotes && (
            <div className="text-xs p-2.5 bg-slate-50 border rounded font-sans text-slate-800">
              <span className="font-semibold block">{isHindi ? 'विशेष टिप्पणी:' : 'Endorsement Note:'}</span>
              {editableNotes}
            </div>
          )}

          {/* Signature Box */}
          <div className="pt-6 sm:pt-8 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-xs font-sans">
            <div>
              <div className="border-t border-slate-400 w-44 mb-1"></div>
              <p className="font-bold text-slate-900">{isHindi ? 'प्रभागीय लेखाकार (DA)' : 'Divisional Accountant'}</p>
              <p className="text-slate-500 text-[11px]">{isHindi ? 'लेखा शाखा, खंड-1' : 'Accounts Branch, Division 1'}</p>
            </div>

            <div className="text-left sm:text-right flex flex-col sm:items-end">
              <div className="border-t border-slate-400 w-44 mb-1 sm:ml-auto"></div>
              <p className="font-bold text-slate-900">{isHindi ? 'कार्यपालक अभियंता' : 'Executive Engineer'}</p>
              <p className="text-slate-500 text-[11px]">{isHindi ? 'लोक निर्माण विभाग' : 'Public Works Department'}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
