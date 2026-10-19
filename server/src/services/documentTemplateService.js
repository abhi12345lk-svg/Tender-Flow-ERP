/**
 * Government Document Template Service
 * Produces clean, standards-compliant Word (.doc/.docx) and printable HTML/PDF representations
 * with full Unicode Hindi and English support.
 */

// Helper to format currency for documents
const formatRupees = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹ 0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(Number(amount));
};

const formatDateStr = (d) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return d;
  }
};

/**
 * Generate Word document for Contract Agreement
 */
export const generateAgreementWordDocument = (agreement) => {
  const isHindi = agreement.language === 'hi';

  const docContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>${agreement.agreementNumber} - Contract Agreement</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  @page {
    size: A4 portrait;
    margin: 25mm 20mm 25mm 20mm;
    mso-page-orientation: portrait;
  }
  body {
    font-family: 'Calibri', 'Mangal', 'Arial Unicode MS', sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1a1a1a;
  }
  h1 {
    font-size: 14pt;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    margin: 0 0 4pt 0;
  }
  h2 {
    font-size: 12pt;
    font-weight: bold;
    text-align: center;
    margin: 0 0 10pt 0;
  }
  .meta-table {
    width: 100%;
    border-collapse: collapse;
    margin: 15pt 0;
  }
  .meta-table td {
    padding: 6pt;
    border: 1pt solid #b0b0b0;
    font-size: 10pt;
  }
  .meta-table .label {
    font-weight: bold;
    background-color: #f5f5f5;
    width: 30%;
  }
  .content-body {
    text-align: justify;
    margin: 15pt 0;
    white-space: pre-wrap;
    font-size: 10.5pt;
  }
  .sig-table {
    width: 100%;
    margin-top: 40pt;
    border-collapse: collapse;
  }
  .sig-table td {
    width: 50%;
    vertical-align: top;
    padding-top: 50pt;
    font-size: 10pt;
  }
</style>
</head>
<body>

  <h1>${isHindi ? 'लोक निर्माण विभाग (भवन एवं मार्ग)' : 'STATE PUBLIC WORKS DEPARTMENT'}</h1>
  <h2>${isHindi ? 'संविदा विलेख एवं कानूनी अनुबंध पत्र' : 'LEGAL ARTICLES OF CONTRACT AGREEMENT'}</h2>
  <div style="text-align: center; font-size: 9.5pt; color: #555; margin-bottom: 15pt;">
    Template Form: ${agreement.templateType || 'Standard PWD Contract Form F-2'}
  </div>

  <table class="meta-table">
    <tr>
      <td class="label">Agreement Number</td>
      <td><strong>${agreement.agreementNumber}</strong></td>
    </tr>
    <tr>
      <td class="label">Work Order Reference</td>
      <td>${agreement.workOrderNumber}</td>
    </tr>
    <tr>
      <td class="label">Tender Number (M)</td>
      <td>${agreement.tenderNumber || '-'}</td>
    </tr>
    <tr>
      <td class="label">Awarded Contractor / Agency</td>
      <td><strong>${agreement.contractorName}</strong></td>
    </tr>
    <tr>
      <td class="label">Date of Agreement Execution</td>
      <td>${formatDateStr(agreement.agreementDate)}</td>
    </tr>
    <tr>
      <td class="label">E-Stamp Duty Certificate</td>
      <td>${agreement.stampDutyNumber || 'E-STAMP-EXEMPTED'} (${formatRupees(agreement.stampDutyAmount)})</td>
    </tr>
    <tr>
      <td class="label">Contract Status</td>
      <td>${agreement.status}</td>
    </tr>
  </table>

  <div class="content-body">
${agreement.content || `MEMORANDUM OF AGREEMENT executed on this date between the Governor of the State acting through the Executive Engineer, Public Works Division (hereinafter referred to as the "Authority") of the First Part, and ${agreement.contractorName} (hereinafter referred to as the "Contractor") of the Second Part.

WHEREAS the Contractor has agreed to perform, execute and maintain the works under Work Order Ref No: ${agreement.workOrderNumber} in accordance with the sanctioned terms, drawings and general conditions of contract.

1. SCOPE OF PERFORMANCE: The Contractor shall execute all specified civil, structural and allied works in strict conformity with departmental specifications.
2. SECURITY DEPOSIT & STATUTORY RETENTION: A security deposit retention shall be regulated in accordance with statutory PWD financial rules.
3. COMPLETION & ARBITRATION: Any claim or dispute arising out of this agreement shall be settled through official arbitration under the Indian Arbitration and Conciliation Act.`}
  </div>

  <table class="sig-table">
    <tr>
      <td>
        <div style="border-top: 1pt solid #000; width: 180pt; margin-bottom: 4pt;"></div>
        <strong>${agreement.contractorName}</strong><br/>
        (Signature of Authorized Contractor)
      </td>
      <td style="text-align: right;">
        <div style="border-top: 1pt solid #000; width: 180pt; margin-left: auto; margin-bottom: 4pt;"></div>
        <strong>Executive Engineer</strong><br/>
        Public Works Division No. 1<br/>
        (For and on behalf of the Governor)
      </td>
    </tr>
  </table>

</body>
</html>
  `;

  return Buffer.from(docContent, 'utf-8');
};

/**
 * Generate Word document for FMD / SD Verification Certificate
 */
export const generateFmdSdWordDocument = (fmdItem, language = 'en') => {
  const isHindi = language === 'hi';

  const docContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>FMD_SD_${fmdItem.tenderNumber}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 25mm 20mm 25mm 20mm;
  }
  body {
    font-family: 'Calibri', 'Mangal', 'Arial Unicode MS', sans-serif;
    font-size: 11pt;
    line-height: 1.5;
  }
  h1 { font-size: 14pt; text-align: center; text-transform: uppercase; margin-bottom: 4pt; }
  h2 { font-size: 12pt; text-align: center; margin-bottom: 15pt; }
  .table { width: 100%; border-collapse: collapse; margin: 15pt 0; }
  .table td { padding: 6pt; border: 1pt solid #b0b0b0; font-size: 10pt; }
  .table .label { font-weight: bold; background: #f5f5f5; width: 35%; }
  .cert-text { text-align: justify; margin: 15pt 0; font-size: 10.5pt; }
</style>
</head>
<body>
  <h1>${isHindi ? 'लोक निर्माण विभाग' : 'PUBLIC WORKS DEPARTMENT'}</h1>
  <h2>${isHindi ? 'सुरक्षा जमा (SD) एवं FMD सत्यापन तथा अभिरक्षा प्रमाण-पत्र' : 'SECURITY DEPOSIT (SD) & FMD CUSTODY CERTIFICATE'}</h2>

  <table class="table">
    <tr>
      <td class="label">${isHindi ? 'निविदा संख्या (Tender No)' : 'Tender Number (M)'}</td>
      <td><strong>${fmdItem.tenderNumber}</strong></td>
    </tr>
    <tr>
      <td class="label">${isHindi ? 'कार्य का विवरण' : 'Tender Title / Works'}</td>
      <td>${fmdItem.tenderTitle}</td>
    </tr>
    <tr>
      <td class="label">${isHindi ? 'संबंधित कार्य आदेश' : 'Related Work Order'}</td>
      <td>${fmdItem.workOrderNumber || 'Direct Tender'}</td>
    </tr>
    <tr>
      <td class="label">${isHindi ? 'संवेदक / फर्म' : 'Contractor / Agency'}</td>
      <td><strong>${fmdItem.contractorName || 'Registered Agency'}</strong></td>
    </tr>
    <tr>
      <td class="label">${isHindi ? 'FMD स्थिति' : 'FMD Status'}</td>
      <td>${fmdItem.fmdStatus}</td>
    </tr>
    <tr>
      <td class="label">SD Amount</td>
      <td><strong>${formatRupees(fmdItem.sdAmount)}</strong></td>
    </tr>
    <tr>
      <td class="label">EMD Amount</td>
      <td>${formatRupees(fmdItem.emdAmount)}</td>
    </tr>
    <tr>
      <td class="label">${isHindi ? 'प्रतिभूति प्रकार' : 'Instrument Type'}</td>
      <td>${fmdItem.instrumentType || 'Bank Guarantee (FDR / BG)'}</td>
    </tr>
    <tr>
      <td class="label">${isHindi ? 'बैंक एवं संदर्भ' : 'Pledged Bank & Reference'}</td>
      <td>${fmdItem.bankName} (${fmdItem.instrumentReference})</td>
    </tr>
    <tr>
      <td class="label">${isHindi ? 'वैधता तिथि' : 'Validity Expiry'}</td>
      <td>${formatDateStr(fmdItem.validityDate)}</td>
    </tr>
  </table>

  <div class="cert-text">
    ${isHindi ? `
    यह प्रमाणित किया जाता है कि निविदा संख्या ${fmdItem.tenderNumber} के संबंध में संवेदक ${fmdItem.contractorName} द्वारा प्रस्तुत की गई सुरक्षा जमा राशि ${formatRupees(fmdItem.sdAmount)} एवं FMD प्रपत्र विभागीय लेखा नियमों के अनुसार विधिवत जांच उपरांत विभागीय अभिरक्षा में सुरक्षित रखी गई है। बैंक गारंटी की पुष्टि बैंक द्वारा प्राप्त हो चुकी है।
    ` : `
    This is to certify that the Security Deposit (SD) amounting to ${formatRupees(fmdItem.sdAmount)} and designated FMD instrument for Tender Ref ${fmdItem.tenderNumber} submitted by contractor ${fmdItem.contractorName} has been verified and deposited under official departmental custody. Confirmation has been received from the issuing bank.
    `}
  </div>

  <table style="width: 100%; margin-top: 50pt; border-collapse: collapse;">
    <tr>
      <td>
        <div style="border-top: 1pt solid #000; width: 160pt; margin-bottom: 4pt;"></div>
        ${isHindi ? 'प्रभागीय लेखाकार (DA)' : 'Divisional Accountant'}<br/>
        Accounts Branch
      </td>
      <td style="text-align: right;">
        <div style="border-top: 1pt solid #000; width: 160pt; margin-left: auto; margin-bottom: 4pt;"></div>
        ${isHindi ? 'कार्यपालक अभियंता' : 'Executive Engineer'}<br/>
        Public Works Division
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return Buffer.from(docContent, 'utf-8');
};
