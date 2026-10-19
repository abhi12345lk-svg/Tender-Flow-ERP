import React, { createContext, useContext, useState } from 'react';
import { generateId } from '../utils/formatters';

const AppContext = createContext(null);

const INITIAL_FINANCIAL_YEARS = [
  {
    id: 'fy-2024-25',
    label: '2024-2025',
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    status: 'Active',
    description: 'Current Operating Financial Year (PWD Division 1)',
    isCurrent: true,
  },
  {
    id: 'fy-2025-26',
    label: '2025-2026',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    status: 'Upcoming',
    description: 'Advance Estimates & Sanctioned Works',
    isCurrent: false,
  },
  {
    id: 'fy-2023-24',
    label: '2023-2024',
    startDate: '2023-04-01',
    endDate: '2024-03-31',
    status: 'Closed',
    description: 'Audited & Reconciled Financial Accounts',
    isCurrent: false,
  },
];

const INITIAL_SUBDIVISIONS = [
  {
    id: 'sub-01',
    code: 'SD-CIVIL-01',
    name: 'Subdivision I (Civil & Buildings)',
    inCharge: 'Er. Suresh Verma, A.E.',
    location: 'Central Division Complex',
    status: 'Active',
  },
  {
    id: 'sub-02',
    code: 'SD-ROADS-02',
    name: 'Subdivision II (Roads & Bridges)',
    inCharge: 'Er. Alok Nath, A.E.',
    location: 'Sector 4 Highway Yard',
    status: 'Active',
  },
  {
    id: 'sub-03',
    code: 'SD-ELEC-03',
    name: 'Subdivision III (Electrical & Utility)',
    inCharge: 'Er. Neha Gupta, A.E.',
    location: 'Power Substation Enclave',
    status: 'Active',
  },
  {
    id: 'sub-04',
    code: 'SD-RURAL-04',
    name: 'Subdivision IV (Rural Works)',
    inCharge: 'Er. D.K. Mishra, A.E.',
    location: 'Tehsil Office Campus',
    status: 'Active',
  },
];

const INITIAL_WORK_ORDERS = [
  {
    id: 'wo-01',
    tenderNumber: 'TN-PWD-2024-892', // Tender Number (M)
    workOrderNumber: 'WO-2024-00142', // Work Order Number (M)
    workOrderDate: '2024-05-15',
    title: 'Construction of High-Level RCC Bridge across Ken Canal Km 14/2',
    contractorName: 'M/s Infra Buildcon India Ltd.',
    td: 'TD-TECH-GRADE-A', // Preserved label TD
    emdNumber: 'EMD-SBIN-88912',
    estimateNumber: 'EST-2024-CIV-441',
    workOrderAmount: 48500000, // 4.85 Crore
    status: 'In Progress',
    emdAmount: 970000,
    sdAmount: 2425000,
    financialYear: '2024-2025',
    subdivisionId: 'sub-02',
    subdivisionName: 'Subdivision II (Roads & Bridges)',
    stipulatedDateOfCompletion: '2025-06-30',
  },
  {
    id: 'wo-02',
    tenderNumber: 'TN-PWD-2024-914',
    workOrderNumber: 'WO-2024-00178',
    workOrderDate: '2024-06-10',
    title: 'Widening & Strengthening of Main District Road MDR-42 (Km 0 to 18)',
    contractorName: 'Apex Roadways Infrastructure Pvt Ltd',
    td: 'TD-REV-SCH-04',
    emdNumber: 'EMD-HDFC-55410',
    estimateNumber: 'EST-2024-RDS-109',
    workOrderAmount: 26800000,
    status: 'Issued',
    emdAmount: 536000,
    sdAmount: 1340000,
    financialYear: '2024-2025',
    subdivisionId: 'sub-02',
    subdivisionName: 'Subdivision II (Roads & Bridges)',
    stipulatedDateOfCompletion: '2025-04-15',
  },
  {
    id: 'wo-03',
    tenderNumber: 'TN-PWD-2024-771',
    workOrderNumber: 'WO-2024-00085',
    workOrderDate: '2024-04-20',
    title: 'Modernization of District Hospital Trauma Center & ICU Wing',
    contractorName: 'Vanguard Healthcare Projects Pvt Ltd',
    td: 'TD-MED-SPL-01',
    emdNumber: 'EMD-PNB-33120',
    estimateNumber: 'EST-2023-BLD-882',
    workOrderAmount: 34200000,
    status: 'Completed',
    emdAmount: 684000,
    sdAmount: 1710000,
    financialYear: '2024-2025',
    subdivisionId: 'sub-01',
    subdivisionName: 'Subdivision I (Civil & Buildings)',
    stipulatedDateOfCompletion: '2024-11-30',
  },
  {
    id: 'wo-04',
    tenderNumber: 'TN-PWD-2024-945',
    workOrderNumber: 'WO-2024-00201',
    workOrderDate: '2024-07-02',
    title: 'Installation of Solar Street Lighting & Dedicated Utility Feeder',
    contractorName: 'Urja Green Tech Solutions LLP',
    td: 'TD-SOLAR-PWR-99',
    emdNumber: 'EMD-ICIC-99231',
    estimateNumber: 'EST-2024-ELC-054',
    workOrderAmount: 12400000,
    status: 'Draft',
    emdAmount: 248000,
    sdAmount: 620000,
    financialYear: '2024-2025',
    subdivisionId: 'sub-03',
    subdivisionName: 'Subdivision III (Electrical & Utility)',
    stipulatedDateOfCompletion: '2025-01-31',
  },
];

const INITIAL_AGREEMENTS = [
  {
    id: 'agr-01',
    agreementNumber: 'AGR/PWD/2024/098',
    workOrderId: 'wo-01',
    workOrderNumber: 'WO-2024-00142',
    tenderNumber: 'TN-PWD-2024-892',
    contractorName: 'M/s Infra Buildcon India Ltd.',
    templateType: 'Standard PWD Contract Form F-2 (Lump Sum)',
    agreementDate: '2024-05-20',
    stampDutyNumber: 'E-STAMP-DL24-998812',
    stampDutyAmount: 15000,
    status: 'Active',
    clausesCount: 42,
    documentTitle: 'Contract Agreement for Ken Canal Bridge Construction',
    content: `MEMORANDUM OF AGREEMENT made this 20th day of May, 2024 between the Governor of State acting through the Executive Engineer, Public Works Division (hereinafter called the "Governor") of the one part and M/s Infra Buildcon India Ltd. (hereinafter called the "Contractor") of the other part.

WHEREAS the Contractor has agreed to execute the work: "Construction of High-Level RCC Bridge across Ken Canal Km 14/2" sanctioned under Estimate No. EST-2024-CIV-441 and Work Order No. WO-2024-00142 at the agreed contract amount of ₹ 4,85,00,000.00 (Rupees Four Crore Eighty-Five Lakh only).

NOW THIS AGREEMENT WITNESSETH as follows:
1. The Contractor shall complete the work within 13 calendar months from the date of issue of Work Order.
2. The Security Deposit of 5% amounting to ₹ 24,25,000.00 shall be retained in accordance with PWD Financial Code Rules.
3. Liquidated damages for delay shall be levied at the rate of 0.5% per week subject to a maximum ceiling of 10% of total contract value.`,
  },
  {
    id: 'agr-02',
    agreementNumber: 'AGR/PWD/2024/112',
    workOrderId: 'wo-02',
    workOrderNumber: 'WO-2024-00178',
    tenderNumber: 'TN-PWD-2024-914',
    contractorName: 'Apex Roadways Infrastructure Pvt Ltd',
    templateType: 'Item Rate Agreement Form B-1',
    agreementDate: '2024-06-18',
    stampDutyNumber: 'E-STAMP-DL24-664421',
    stampDutyAmount: 12000,
    status: 'Active',
    clausesCount: 38,
    documentTitle: 'Agreement for MDR-42 Widening & Strengthening',
    content: `THIS AGREEMENT executed on 18th June, 2024 between PWD Division 1 and Apex Roadways Infrastructure Pvt Ltd for MDR-42 Highway Widening. All standard specifications of Ministry of Road Transport & Highways (MoRTH) Section 500 shall apply in strict conformity.`,
  },
];

const INITIAL_BILLING = [
  {
    id: 'bill-01',
    invoiceNumber: 'RA-01/PWD/2024-25',
    invoiceDate: '2024-08-14',
    workOrderId: 'wo-01',
    workOrderNumber: 'WO-2024-00142',
    tenderNumber: 'TN-PWD-2024-892',
    subdivisionId: 'sub-02',
    subdivisionName: 'Subdivision II (Roads & Bridges)',
    contractorName: 'M/s Infra Buildcon India Ltd.',
    dateOfCompletion: '2024-08-10',
    dateOfHandover: '2024-08-12',
    amount: 8500000, // Basic
    gstRate: 18,
    gstAmount: 1530000,
    totalAmount: 10030000, // Basic + GST
    status: 'Passed',
    deductions: {
      sdAmount: 425000, // 5% SD
      tdsAmount: 170000, // 2% TDS
      labourCess: 85000, // 1% Labour Cess
      royalty: 45000,
      penalty: 0,
    },
    totalDeductions: 725000,
    netPayable: 9305000,
    remarks: '1st Running Account (RA) Bill approved after Divisional Scrutiny',
  },
  {
    id: 'bill-02',
    invoiceNumber: 'FINAL-BILL/2024-03',
    invoiceDate: '2024-11-28',
    workOrderId: 'wo-03',
    workOrderNumber: 'WO-2024-00085',
    tenderNumber: 'TN-PWD-2024-771',
    subdivisionId: 'sub-01',
    subdivisionName: 'Subdivision I (Civil & Buildings)',
    contractorName: 'Vanguard Healthcare Projects Pvt Ltd',
    dateOfCompletion: '2024-11-20',
    dateOfHandover: '2024-11-25',
    amount: 14200000,
    gstRate: 18,
    gstAmount: 2556000,
    totalAmount: 16756000,
    status: 'Submitted',
    deductions: {
      sdAmount: 710000,
      tdsAmount: 284000,
      labourCess: 142000,
      royalty: 30000,
      penalty: 0,
    },
    totalDeductions: 1166000,
    netPayable: 15590000,
    remarks: 'Final Completion Bill submitted with measurement book inspection notes',
  },
];

const INITIAL_FMD_SD = [
  {
    id: 'fmd-01',
    tenderNumber: 'TN-PWD-2024-892',
    tenderTitle: 'Construction of High-Level RCC Bridge across Ken Canal Km 14/2',
    workOrderId: 'wo-01',
    workOrderNumber: 'WO-2024-00142',
    contractorName: 'M/s Infra Buildcon India Ltd.',
    fmdStatus: 'Verified & Retained',
    sdAmount: 2425000,
    emdAmount: 970000,
    instrumentType: 'Bank Guarantee (FDR / BG)',
    bankName: 'State Bank of India (Commercial Branch)',
    instrumentReference: 'BG-SBI-ND-2024-0994',
    validityDate: '2026-06-30',
    uploadedDocuments: [
      {
        id: 'doc-1',
        name: 'SBI_Bank_Guarantee_24.25Lakhs.pdf',
        size: '1.4 MB',
        uploadedAt: '2024-05-18 11:30 AM',
        type: 'application/pdf',
      },
      {
        id: 'doc-2',
        name: 'Contractor_Security_Undertaking_Signed.pdf',
        size: '840 KB',
        uploadedAt: '2024-05-19 02:15 PM',
        type: 'application/pdf',
      },
    ],
  },
  {
    id: 'fmd-02',
    tenderNumber: 'TN-PWD-2024-914',
    tenderTitle: 'Widening & Strengthening of Main District Road MDR-42 (Km 0 to 18)',
    workOrderId: 'wo-02',
    workOrderNumber: 'WO-2024-00178',
    contractorName: 'Apex Roadways Infrastructure Pvt Ltd',
    fmdStatus: 'Under Scrutiny',
    sdAmount: 1340000,
    emdAmount: 536000,
    instrumentType: 'Fixed Deposit Receipt (FDR)',
    bankName: 'HDFC Bank Ltd',
    instrumentReference: 'FDR-501004882199',
    validityDate: '2025-10-31',
    uploadedDocuments: [
      {
        id: 'doc-3',
        name: 'HDFC_FDR_Pledge_Receipt.pdf',
        size: '620 KB',
        uploadedAt: '2024-06-12 10:45 AM',
        type: 'application/pdf',
      },
    ],
  },
];

export function AppProvider({ children }) {
  // Financial Years
  const [financialYears, setFinancialYears] = useState(INITIAL_FINANCIAL_YEARS);
  const [activeFY, setActiveFY] = useState('2024-2025');

  // Subdivisions
  const [subdivisions, setSubdivisions] = useState(INITIAL_SUBDIVISIONS);

  // Work Orders
  const [workOrders, setWorkOrders] = useState(INITIAL_WORK_ORDERS);

  // Agreements
  const [agreements, setAgreements] = useState(INITIAL_AGREEMENTS);

  // Billing
  const [billingList, setBillingList] = useState(INITIAL_BILLING);

  // FMD / SD
  const [fmdList, setFmdList] = useState(INITIAL_FMD_SD);

  // Notifications / Toasts
  const [toasts, setToasts] = useState([
    {
      id: 'welcome-toast',
      type: 'info',
      title: 'TenderFlow ERP Initialized',
      message: 'Step 1 frontend environment ready with 6 core modules.',
    },
  ]);

  const addToast = ({ type = 'info', title, message, duration = 4000 }) => {
    const id = generateId('toast');
    setToasts((prev) => [...prev, { id, type, title, message }]);
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Switch Active FY
  const handleSetActiveFY = (fyLabel) => {
    setActiveFY(fyLabel);
    setFinancialYears((prev) =>
      prev.map((fy) => ({
        ...fy,
        isCurrent: fy.label === fyLabel,
      }))
    );
    addToast({
      type: 'success',
      title: 'Active Financial Year Changed',
      message: `Global context switched to FY ${fyLabel}`,
    });
  };

  // FY CRUD
  const addFinancialYear = (fyData) => {
    const newFy = {
      id: generateId('fy'),
      ...fyData,
      isCurrent: financialYears.length === 0,
    };
    setFinancialYears((prev) => [newFy, ...prev]);
    addToast({
      type: 'success',
      title: 'Financial Year Created',
      message: `FY ${newFy.label} successfully registered in frontend state.`,
    });
    return newFy;
  };

  const updateFinancialYear = (id, fyData) => {
    setFinancialYears((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...fyData } : item))
    );
    addToast({
      type: 'success',
      title: 'Financial Year Updated',
      message: `FY record updated successfully.`,
    });
  };

  const deleteFinancialYear = (id) => {
    const target = financialYears.find((f) => f.id === id);
    if (target?.isCurrent) {
      addToast({
        type: 'error',
        title: 'Cannot Delete Active FY',
        message: 'Please activate another financial year before deleting this one.',
      });
      return false;
    }
    setFinancialYears((prev) => prev.filter((item) => item.id !== id));
    addToast({
      type: 'warning',
      title: 'Financial Year Deleted',
      message: `FY ${target?.label || ''} removed from local session.`,
    });
    return true;
  };

  // Subdivision CRUD
  const addSubdivision = (subData) => {
    const newSub = {
      id: generateId('sub'),
      ...subData,
    };
    setSubdivisions((prev) => [...prev, newSub]);
    addToast({
      type: 'success',
      title: 'Subdivision Added',
      message: `${newSub.name} registered.`,
    });
    return newSub;
  };

  const updateSubdivision = (id, subData) => {
    setSubdivisions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...subData } : item))
    );
    addToast({
      type: 'success',
      title: 'Subdivision Updated',
      message: 'Subdivision details saved.',
    });
  };

  const deleteSubdivision = (id) => {
    // Check if associated with any work orders
    const count = workOrders.filter((wo) => wo.subdivisionId === id).length;
    if (count > 0) {
      addToast({
        type: 'error',
        title: 'Subdivision In Use',
        message: `Cannot delete: ${count} Work Order(s) are associated with this subdivision.`,
      });
      return false;
    }
    setSubdivisions((prev) => prev.filter((item) => item.id !== id));
    addToast({
      type: 'warning',
      title: 'Subdivision Removed',
      message: 'Subdivision deleted from current view.',
    });
    return true;
  };

  // Work Order CRUD
  const addWorkOrder = (woData) => {
    const newWo = {
      id: generateId('wo'),
      ...woData,
    };
    setWorkOrders((prev) => [newWo, ...prev]);
    addToast({
      type: 'success',
      title: 'Work Order Created',
      message: `Work Order ${newWo.workOrderNumber} registered successfully.`,
    });
    return newWo;
  };

  const updateWorkOrder = (id, woData) => {
    setWorkOrders((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...woData } : item))
    );
    addToast({
      type: 'success',
      title: 'Work Order Updated',
      message: `Changes saved for Work Order ${woData.workOrderNumber || ''}.`,
    });
  };

  const deleteWorkOrder = (id) => {
    const target = workOrders.find((w) => w.id === id);
    setWorkOrders((prev) => prev.filter((item) => item.id !== id));
    addToast({
      type: 'warning',
      title: 'Work Order Deleted',
      message: `Work Order ${target?.workOrderNumber || id} deleted.`,
    });
    return true;
  };

  // Agreement CRUD
  const addAgreement = (agrData) => {
    const newAgr = {
      id: generateId('agr'),
      ...agrData,
    };
    setAgreements((prev) => [newAgr, ...prev]);
    addToast({
      type: 'success',
      title: 'Agreement Registered',
      message: `Agreement ${newAgr.agreementNumber} created.`,
    });
    return newAgr;
  };

  const updateAgreement = (id, agrData) => {
    setAgreements((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...agrData } : item))
    );
    addToast({
      type: 'success',
      title: 'Agreement Updated',
      message: `Agreement details updated.`,
    });
  };

  const deleteAgreement = (id) => {
    setAgreements((prev) => prev.filter((item) => item.id !== id));
    addToast({
      type: 'warning',
      title: 'Agreement Removed',
      message: 'Agreement entry deleted.',
    });
    return true;
  };

  // Billing CRUD
  const addBilling = (billData) => {
    const newBill = {
      id: generateId('bill'),
      ...billData,
    };
    setBillingList((prev) => [newBill, ...prev]);
    addToast({
      type: 'success',
      title: 'Bill Record Generated',
      message: `Invoice ${newBill.invoiceNumber} recorded.`,
    });
    return newBill;
  };

  const updateBilling = (id, billData) => {
    setBillingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...billData } : item))
    );
    addToast({
      type: 'success',
      title: 'Bill Updated',
      message: `Invoice ${billData.invoiceNumber || ''} updated successfully.`,
    });
  };

  const deleteBilling = (id) => {
    setBillingList((prev) => prev.filter((item) => item.id !== id));
    addToast({
      type: 'warning',
      title: 'Bill Deleted',
      message: 'Invoice record removed from session.',
    });
    return true;
  };

  // FMD / SD Actions
  const updateFmdItem = (id, fmdData) => {
    setFmdList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...fmdData } : item))
    );
    addToast({
      type: 'success',
      title: 'FMD / SD Updated',
      message: 'FMD / SD details updated successfully.',
    });
  };

  const addFmdDocument = (fmdId, docFile) => {
    const newDoc = {
      id: generateId('doc'),
      name: docFile.name,
      size: `${(docFile.size / 1024).toFixed(1)} KB`,
      uploadedAt: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      type: docFile.type || 'application/pdf',
    };

    setFmdList((prev) =>
      prev.map((item) =>
        item.id === fmdId
          ? {
              ...item,
              uploadedDocuments: [...(item.uploadedDocuments || []), newDoc],
            }
          : item
      )
    );

    addToast({
      type: 'info',
      title: 'Document Upload Preview',
      message: `"${docFile.name}" added to session preview. Step 2 will persist to cloud storage.`,
    });
  };

  const removeFmdDocument = (fmdId, docId) => {
    setFmdList((prev) =>
      prev.map((item) =>
        item.id === fmdId
          ? {
              ...item,
              uploadedDocuments: item.uploadedDocuments.filter((d) => d.id !== docId),
            }
          : item
      )
    );
    addToast({
      type: 'warning',
      title: 'Document Removed',
      message: 'Document deleted from session preview.',
    });
  };

  return (
    <AppContext.Provider
      value={{
        financialYears,
        activeFY,
        setActiveFY: handleSetActiveFY,
        addFinancialYear,
        updateFinancialYear,
        deleteFinancialYear,

        subdivisions,
        addSubdivision,
        updateSubdivision,
        deleteSubdivision,

        workOrders,
        addWorkOrder,
        updateWorkOrder,
        deleteWorkOrder,

        agreements,
        addAgreement,
        updateAgreement,
        deleteAgreement,

        billingList,
        addBilling,
        updateBilling,
        deleteBilling,

        fmdList,
        updateFmdItem,
        addFmdDocument,
        removeFmdDocument,

        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
