import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ShadingType,
  VerticalAlign,
  Footer,
  PageNumber,
} from 'docx';

/**
 * Currency formatter helper
 */
const formatRupees = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹ 0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount));
};

/**
 * Date formatter helper
 */
const formatDateStr = (d) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(d);
  }
};

/**
 * Triggers client-side browser file download for a generated Blob
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Subtle border style for tables
const cellBorder = {
  top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
  left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
  right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
};

const cellMargins = {
  top: 120,
  bottom: 120,
  left: 150,
  right: 150,
};

/**
 * Generate native OpenXML Word Document (.docx) for Agreement contracts entirely client-side
 * Works 100% offline without Render/Express backend dependency.
 */
export const generateAgreementDocx = async (agreement, options = {}) => {
  if (!agreement) throw new Error('Agreement record is required for document generation');

  const safeFilename = `${(agreement.agreementNumber || 'Agreement').replace(/[\/\\]/g, '_')}_Official_Contract.docx`;

  const metaRows = [
    [
      { label: 'Agreement Number', val: agreement.agreementNumber || '-' },
      { label: 'Date of Execution', val: formatDateStr(agreement.agreementDate) },
    ],
    [
      { label: 'Work Order Reference', val: agreement.workOrderNumber || '-' },
      { label: 'Tender Number (M)', val: agreement.tenderNumber || '-' },
    ],
    [
      { label: 'Contractor / Agency', val: agreement.contractorName || '-' },
      { label: 'Contract Status', val: agreement.status || 'Active' },
    ],
    [
      { label: 'E-Stamp Duty Certificate', val: agreement.stampDutyNumber || 'E-STAMP-EXEMPTED' },
      { label: 'Stamp Duty Amount', val: formatRupees(agreement.stampDutyAmount) },
    ],
  ];

  const tableRows = metaRows.map((pair) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: cellBorder,
          margins: cellMargins,
          shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
          children: [
            new Paragraph({
              children: [new TextRun({ text: pair[0].label, bold: true, size: 19, font: 'Calibri', color: '475569' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: cellBorder,
          margins: cellMargins,
          children: [
            new Paragraph({
              children: [new TextRun({ text: pair[0].val, bold: true, size: 19, font: 'Calibri', color: '0F172A' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: cellBorder,
          margins: cellMargins,
          shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
          children: [
            new Paragraph({
              children: [new TextRun({ text: pair[1].label, bold: true, size: 19, font: 'Calibri', color: '475569' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: cellBorder,
          margins: cellMargins,
          children: [
            new Paragraph({
              children: [new TextRun({ text: pair[1].val, bold: true, size: 19, font: 'Calibri', color: '0F172A' })],
            }),
          ],
        }),
      ],
    });
  });

  const agreementBodyText = agreement.content || `MEMORANDUM OF AGREEMENT executed on this date between the Executive Engineer, Public Works Department for and on behalf of the Governor (First Party) and ${agreement.contractorName || 'the Contractor'} (Second Party/Contractor).

1. SCOPE OF PERFORMANCE: The Contractor undertakes to execute, complete and maintain in conformity with the provisions of this contract all works described in Work Order No. ${agreement.workOrderNumber || 'sanctioned works'}.
2. LIQUIDATED DAMAGES & RETENTION: The Security Deposit and statutory retention shall be regulated strictly according to standard PWD General Conditions of Contract (GCC).
3. STATUTORY COMPLIANCE: The Contractor shall comply with all statutory requirements including GST deductions, Labour Cess, and Income Tax withholding.
4. DISPUTE RESOLUTION: Any dispute or difference arising out of or in connection with this agreement shall be settled through official arbitration under the Indian Arbitration and Conciliation Act.`;

  const contentParagraphs = agreementBodyText.split('\n\n').map((block) => {
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 180, line: 280 },
      children: [
        new TextRun({
          text: block.trim(),
          size: 21,
          font: 'Calibri',
          color: '1E293B',
        }),
      ],
    });
  });

  // Signatures Table
  const signaturesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 300, bottom: 100, left: 100, right: 100 },
            children: [
              new Paragraph({
                spacing: { after: 800 },
                children: [
                  new TextRun({ text: 'Signed, Sealed & Delivered by:', size: 19, color: '64748B', font: 'Calibri' }),
                ],
              }),
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  new TextRun({ text: '_____________________________________', color: '94A3B8', size: 19 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: agreement.contractorName || 'Authorized Contractor', bold: true, size: 21, font: 'Calibri', color: '0F172A' }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: '(Signature of Authorized Contractor)', size: 18, color: '64748B', font: 'Calibri' }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 300, bottom: 100, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 800 },
                children: [
                  new TextRun({ text: 'For and on behalf of the Governor:', size: 19, color: '64748B', font: 'Calibri' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 80 },
                children: [
                  new TextRun({ text: '_____________________________________', color: '94A3B8', size: 19 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Executive Engineer', bold: true, size: 21, font: 'Calibri', color: '0F172A' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Public Works Division No. 1', size: 18, color: '64748B', font: 'Calibri' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'TenderFlow ERP — Standard PWD Agreement | Page ', size: 16, color: '94A3B8', font: 'Calibri' }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: 'GOVERNMENT OF STATE / PUBLIC WORKS DEPARTMENT',
                bold: true,
                size: 24,
                font: 'Calibri',
                color: '1E3A8A',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: 'OFFICE OF THE EXECUTIVE ENGINEER, DIVISION NO. 1',
                bold: true,
                size: 22,
                font: 'Calibri',
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'FORM OF CONTRACT & LEGAL ARTICLES OF AGREEMENT',
                bold: true,
                size: 20,
                font: 'Calibri',
                color: '334155',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: `Template Reference: ${agreement.templateType || 'Standard PWD Contract Form F-2'}`,
                italics: true,
                size: 18,
                font: 'Calibri',
                color: '64748B',
              }),
            ],
          }),

          // Meta Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),

          new Paragraph({ spacing: { after: 240 } }),

          // Clauses Heading
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'ARTICLES OF AGREEMENT & GENERAL CONDITIONS',
                bold: true,
                size: 21,
                font: 'Calibri',
                color: '0F172A',
              }),
            ],
          }),

          // Clauses Body
          ...contentParagraphs,

          new Paragraph({ spacing: { after: 200 } }),

          // Signatures
          signaturesTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  if (!options.returnBlobOnly) {
    downloadBlob(blob, safeFilename);
  }
  return { success: true, filename: safeFilename, blob };
};

/**
 * Generate native OpenXML Word Document (.docx) for FMD / SD Custody Certificate
 * Supports bilingual Hindi & English text rendering entirely client-side.
 */
export const generateFmdCustodyDocx = async (fmdItem, language = 'en', editableNotes = '', options = {}) => {
  if (!fmdItem) throw new Error('FMD / SD record is required for document generation');

  const isHindi = language === 'hi';
  const langSuffix = isHindi ? 'HI' : 'EN';
  const safeFilename = `${(fmdItem.tenderNumber || 'Tender').replace(/[\/\\]/g, '_')}_Custody_Certificate_${langSuffix}.docx`;

  const metaRows = [
    [
      { label: isHindi ? 'निविदा संख्या (Tender No)' : 'Tender Number (M)', val: fmdItem.tenderNumber || '-' },
      { label: isHindi ? 'संबंधित कार्य आदेश' : 'Related Work Order', val: fmdItem.workOrderNumber || 'Direct Tender Record' },
    ],
    [
      { label: isHindi ? 'संवेदक / फर्म का नाम' : 'Contractor / Agency Name', val: fmdItem.contractorName || '-' },
      { label: isHindi ? 'FMD स्थिति' : 'FMD Custody Status', val: fmdItem.fmdStatus || 'Deposited' },
    ],
    [
      { label: 'Security Deposit (SD)', val: formatRupees(fmdItem.sdAmount) },
      { label: 'Earnest Money (EMD)', val: formatRupees(fmdItem.emdAmount) },
    ],
    [
      { label: isHindi ? 'प्रतिभूति प्रकार' : 'Instrument Type', val: fmdItem.instrumentType || 'Bank Guarantee / FDR' },
      { label: isHindi ? 'बैंक एवं संदर्भ' : 'Pledged Bank & Ref', val: `${fmdItem.bankName || 'Scheduled Bank'} (${fmdItem.instrumentReference || 'BG/FDR'})` },
    ],
    [
      { label: isHindi ? 'वैधता समाप्ति तिथि' : 'Validity Upto Date', val: formatDateStr(fmdItem.validityDate) },
      { label: isHindi ? 'सत्यापन स्थिति' : 'Verification Status', val: fmdItem.verificationStatus || 'Verified & Pledged' },
    ],
  ];

  const tableRows = metaRows.map((pair) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: cellBorder,
          margins: cellMargins,
          shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
          children: [
            new Paragraph({
              children: [new TextRun({ text: pair[0].label, bold: true, size: 19, font: 'Calibri', color: '475569' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: cellBorder,
          margins: cellMargins,
          children: [
            new Paragraph({
              children: [new TextRun({ text: pair[0].val, bold: true, size: 19, font: 'Calibri', color: '0F172A' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: cellBorder,
          margins: cellMargins,
          shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
          children: [
            new Paragraph({
              children: [new TextRun({ text: pair[1].label, bold: true, size: 19, font: 'Calibri', color: '475569' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: cellBorder,
          margins: cellMargins,
          children: [
            new Paragraph({
              children: [new TextRun({ text: pair[1].val, bold: true, size: 19, font: 'Calibri', color: '0F172A' })],
            }),
          ],
        }),
      ],
    });
  });

  // Bilingual certification paragraphs
  const certParagraphs = isHindi
    ? [
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160, line: 280 },
          children: [
            new TextRun({
              text: `यह प्रमाणित किया जाता है कि संवेदक `,
              size: 21,
              font: 'Calibri',
              color: '1E293B',
            }),
            new TextRun({
              text: `${fmdItem.contractorName || 'संवेदक'} `,
              bold: true,
              size: 21,
              font: 'Calibri',
              color: '0F172A',
            }),
            new TextRun({
              text: `द्वारा कार्य "${fmdItem.tenderTitle || 'विभागीय कार्य'}" (निविदा संख्या ${fmdItem.tenderNumber}) के संबंध में प्रस्तुत की गई सुरक्षा जमा (SD) राशि `,
              size: 21,
              font: 'Calibri',
              color: '1E293B',
            }),
            new TextRun({
              text: `${formatRupees(fmdItem.sdAmount)} `,
              bold: true,
              size: 21,
              font: 'Calibri',
              color: '1E3A8A',
            }),
            new TextRun({
              text: `एवं FMD प्रपत्र विभागीय लेखा नियमों के अनुसार विधिवत जांच उपरांत विभागीय अभिरक्षा में सुरक्षित रखी गई है।`,
              size: 21,
              font: 'Calibri',
              color: '1E293B',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160, line: 280 },
          children: [
            new TextRun({
              text: `2. बैंक गारंटी / एफ.डी.आर. संख्या `,
              size: 21,
              font: 'Calibri',
              color: '1E293B',
            }),
            new TextRun({
              text: `${fmdItem.instrumentReference || 'BG/FDR'} `,
              bold: true,
              size: 21,
              font: 'Calibri',
              color: '0F172A',
            }),
            new TextRun({
              text: `जारीकर्ता बैंक (${fmdItem.bankName || 'अनुसूचित वाणिज्यिक बैंक'}) से संपुष्टि (Confirmation) प्राप्त हो चुकी है।`,
              size: 21,
              font: 'Calibri',
              color: '1E293B',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 280 },
          children: [
            new TextRun({
              text: `3. कार्य के संतोषजनक समापन एवं दोष निवारण अवधि (Defect Liability Period) पूर्ण होने के उपरांत ही सक्षम अधिकारी की अनुमति से नियमानुसार विमुक्ति (Release) की कार्रवाई की जाएगी।`,
              size: 21,
              font: 'Calibri',
              color: '1E293B',
            }),
          ],
        }),
      ]
    : [
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160, line: 280 },
          children: [
            new TextRun({
              text: `This is to certify that the Security Deposit (SD) amounting to `,
              size: 21,
              font: 'Calibri',
              color: '1E293B',
            }),
            new TextRun({
              text: `${formatRupees(fmdItem.sdAmount)} `,
              bold: true,
              size: 21,
              font: 'Calibri',
              color: '1E3A8A',
            }),
            new TextRun({
              text: `and designated FMD instrument submitted by contractor `,
              size: 21,
              font: 'Calibri',
              color: '1E293B',
            }),
            new TextRun({
              text: `${fmdItem.contractorName || 'Contractor'} `,
              bold: true,
              size: 21,
              font: 'Calibri',
              color: '0F172A',
            }),
            new TextRun({
              text: `for the work "${fmdItem.tenderTitle || 'Departmental Work'}" (Tender Ref: ${fmdItem.tenderNumber}) has been verified and deposited under official departmental custody in compliance with PWD financial regulations.`,
              size: 21,
              font: 'Calibri',
              color: '1E293B',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160, line: 280 },
          children: [
            new TextRun({
              text: `2. The instrument bearing reference `,
              size: 21,
              font: 'Calibri',
              color: '1E293B',
            }),
            new TextRun({
              text: `${fmdItem.instrumentReference || 'BG/FDR'} `,
              bold: true,
              size: 21,
              font: 'Calibri',
              color: '0F172A',
            }),
            new TextRun({
              text: `issued by ${fmdItem.bankName || 'Scheduled Commercial Bank'} has been verified through independent bank confirmation in accordance with financial rules.`,
              size: 21,
              font: 'Calibri',
              color: '1E293B',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 280 },
          children: [
            new TextRun({
              text: `3. The aforementioned SD / FMD shall remain pledged and valid through the contract duration and defect liability period, and shall only be released upon formal sanction by the Executive Engineer.`,
              size: 21,
              font: 'Calibri',
              color: '1E293B',
            }),
          ],
        }),
      ];

  // Optional Endorsement / Notes section
  const endorsementBlocks = [];
  if (editableNotes && editableNotes.trim()) {
    endorsementBlocks.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: isHindi ? 'विशेष टिप्पणी एवं आदेश (Endorsement):' : 'Special Departmental Endorsement / Remarks:',
            bold: true,
            size: 20,
            font: 'Calibri',
            color: '0F172A',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: editableNotes.trim(),
            italics: true,
            size: 20,
            font: 'Calibri',
            color: '334155',
          }),
        ],
      })
    );
  }

  // Bilingual Signatures Table
  const signaturesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 300, bottom: 100, left: 100, right: 100 },
            children: [
              new Paragraph({
                spacing: { after: 800 },
                children: [
                  new TextRun({
                    text: isHindi ? 'सत्यापित एवं अभिरक्षा में प्राप्तकर्ता:' : 'Verified & Custody Authenticated by:',
                    size: 19,
                    color: '64748B',
                    font: 'Calibri',
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  new TextRun({ text: '_____________________________________', color: '94A3B8', size: 19 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: isHindi ? 'प्रभागीय लेखाकार (DA)' : 'Divisional Accountant (DA)',
                    bold: true,
                    size: 21,
                    font: 'Calibri',
                    color: '0F172A',
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: isHindi ? 'लेखा शाखा, खंड-1' : 'Accounts Branch, Division No. 1',
                    size: 18,
                    color: '64748B',
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 300, bottom: 100, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 800 },
                children: [
                  new TextRun({
                    text: isHindi ? 'सक्षम प्राधिकारी:' : 'Competent Sanctioning Authority:',
                    size: 19,
                    color: '64748B',
                    font: 'Calibri',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 80 },
                children: [
                  new TextRun({ text: '_____________________________________', color: '94A3B8', size: 19 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: isHindi ? 'कार्यपालक अभियंता' : 'Executive Engineer',
                    bold: true,
                    size: 21,
                    font: 'Calibri',
                    color: '0F172A',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: isHindi ? 'लोक निर्माण विभाग' : 'Public Works Department',
                    size: 18,
                    color: '64748B',
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `TenderFlow ERP — ${isHindi ? 'FMD/SD अभिरक्षा प्रमाण-पत्र' : 'FMD/SD Custody Certificate'} | Page `,
                    size: 16,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: isHindi ? 'लोक निर्माण विभाग (भवन एवं मार्ग)' : 'PUBLIC WORKS DEPARTMENT (GOVERNMENT OF STATE)',
                bold: true,
                size: 24,
                font: 'Calibri',
                color: '1E3A8A',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: isHindi ? 'सुरक्षा जमा (SD) एवं FMD सत्यापन तथा अभिरक्षा प्रमाण-पत्र' : 'SECURITY DEPOSIT (SD) & FMD CUSTODY CERTIFICATE',
                bold: true,
                size: 22,
                font: 'Calibri',
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: isHindi
                  ? 'कार्यालय कार्यपालक अभियंता, खंड-1 | प्रपत्र संख्या: PWD/FMD-SD/2024'
                  : 'Office of the Executive Engineer, Division No. 1 | Form Ref: PWD/FMD-SD/2024',
                italics: true,
                size: 18,
                font: 'Calibri',
                color: '64748B',
              }),
            ],
          }),

          // Metadata Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),

          new Paragraph({ spacing: { after: 240 } }),

          // Certification Section
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: isHindi ? 'विभागीय सत्यापन एवं कानूनी अभिरक्षा प्रमाण' : 'LEGAL VERIFICATION & STATUTORY CUSTODY DECLARATION',
                bold: true,
                size: 21,
                font: 'Calibri',
                color: '0F172A',
              }),
            ],
          }),

          ...certParagraphs,

          ...endorsementBlocks,

          new Paragraph({ spacing: { after: 200 } }),

          signaturesTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  if (!options.returnBlobOnly) {
    downloadBlob(blob, safeFilename);
  }
  return { success: true, filename: safeFilename, blob };
};
