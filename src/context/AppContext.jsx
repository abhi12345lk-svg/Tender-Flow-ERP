import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateId } from '../utils/formatters';
import { api } from '../services/apiClient';

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
    tenderNumber: 'TN-PWD-2024-892',
    workOrderNumber: 'WO-2024-00142',
    workOrderDate: '2024-05-15',
    title: 'Construction of High-Level RCC Bridge across Ken Canal Km 14/2',
    contractorName: 'M/s Infra Buildcon India Ltd.',
    td: 'TD-TECH-GRADE-A',
    emdNumber: 'EMD-SBIN-88912',
    estimateNumber: 'EST-2024-CIV-441',
    workOrderAmount: 48500000,
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
    content: `MEMORANDUM OF AGREEMENT made this 20th day of May, 2024 between the Governor of State acting through the Executive Engineer, Public Works Division of the one part and M/s Infra Buildcon India Ltd. of the other part.`,
    language: 'en',
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
    content: `THIS AGREEMENT executed on 18th June, 2024 between PWD Division 1 and Apex Roadways Infrastructure Pvt Ltd for MDR-42 Highway Widening.`,
    language: 'en',
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
    amount: 8500000,
    gstRate: 18,
    gstAmount: 1530000,
    totalAmount: 10030000,
    status: 'Passed',
    deductions: {
      sdAmount: 425000,
      tdsAmount: 170000,
      labourCess: 85000,
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

// Helper to normalize MongoDB document to UI object (mapping _id -> id)
const normalizeDoc = (doc) => {
  if (!doc) return doc;
  return {
    ...doc,
    id: doc._id ? doc._id.toString() : doc.id,
    subdivisionId: doc.subdivision?._id ? doc.subdivision._id.toString() : (doc.subdivision || doc.subdivisionId),
    workOrderId: doc.workOrder?._id ? doc.workOrder._id.toString() : (doc.workOrder || doc.workOrderId),
    startDate: doc.startDate ? doc.startDate.split('T')[0] : doc.startDate,
    endDate: doc.endDate ? doc.endDate.split('T')[0] : doc.endDate,
    workOrderDate: doc.workOrderDate ? doc.workOrderDate.split('T')[0] : doc.workOrderDate,
    invoiceDate: doc.invoiceDate ? doc.invoiceDate.split('T')[0] : doc.invoiceDate,
    agreementDate: doc.agreementDate ? doc.agreementDate.split('T')[0] : doc.agreementDate,
    completionDate: doc.completionDate ? doc.completionDate.split('T')[0] : doc.completionDate,
    handoverDate: doc.handoverDate ? doc.handoverDate.split('T')[0] : doc.handoverDate,
    validityDate: doc.validityDate ? doc.validityDate.split('T')[0] : doc.validityDate,
  };
};

export function AppProvider({ children }) {
  const [financialYears, setFinancialYears] = useState(INITIAL_FINANCIAL_YEARS);
  const [activeFY, setActiveFY] = useState('2024-2025');
  const [subdivisions, setSubdivisions] = useState(INITIAL_SUBDIVISIONS);
  const [workOrders, setWorkOrders] = useState(INITIAL_WORK_ORDERS);
  const [agreements, setAgreements] = useState(INITIAL_AGREEMENTS);
  const [billingList, setBillingList] = useState(INITIAL_BILLING);
  const [fmdList, setFmdList] = useState(INITIAL_FMD_SD);

  // Connection & loading state
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([
    {
      id: 'step2-init',
      type: 'info',
      title: 'TenderFlow ERP Backend & Database',
      message: 'Step 2: Connecting to Node.js & MongoDB API...',
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

  // Fetch initial data from backend on load
  const syncWithBackend = async () => {
    try {
      setIsLoading(true);
      const health = await api.health.check();

      if (health.status === 'healthy') {
        setIsBackendConnected(true);

        // Fetch all 6 modules from MongoDB in parallel
        const [fyRes, subRes, woRes, agrRes, billRes, fmdRes] = await Promise.allSettled([
          api.financialYears.getAll(),
          api.subdivisions.getAll(),
          api.workOrders.getAll(),
          api.agreements.getAll(),
          api.billing.getAll(),
          api.fmdSd.getAll(),
        ]);

        if (fyRes.status === 'fulfilled' && fyRes.value?.data?.length > 0) {
          const list = fyRes.value.data.map(normalizeDoc);
          setFinancialYears(list);
          const current = list.find((f) => f.isCurrent);
          if (current) setActiveFY(current.label);
        }

        if (subRes.status === 'fulfilled' && subRes.value?.data?.length > 0) {
          setSubdivisions(subRes.value.data.map(normalizeDoc));
        }

        if (woRes.status === 'fulfilled' && woRes.value?.data?.length > 0) {
          setWorkOrders(woRes.value.data.map(normalizeDoc));
        }

        if (agrRes.status === 'fulfilled' && agrRes.value?.data?.length > 0) {
          setAgreements(agrRes.value.data.map(normalizeDoc));
        }

        if (billRes.status === 'fulfilled' && billRes.value?.data?.length > 0) {
          setBillingList(billRes.value.data.map(normalizeDoc));
        }

        if (fmdRes.status === 'fulfilled' && fmdRes.value?.data?.length > 0) {
          setFmdList(fmdRes.value.data.map(normalizeDoc));
        }

        addToast({
          type: 'success',
          title: 'MongoDB Connected',
          message: 'Synced 6 government modules with Node.js & MongoDB backend.',
          duration: 3500,
        });
      } else {
        setIsBackendConnected(false);
        addToast({
          type: 'warning',
          title: 'Backend Status: Pending Database',
          message: 'Operating with in-memory government datasets until server connection is verified.',
          duration: 4000,
        });
      }
    } catch (err) {
      setIsBackendConnected(false);
      console.warn('[AppContext] Running in frontend fallback mode:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncWithBackend();
  }, []);

  // Switch Active FY
  const handleSetActiveFY = async (fyLabel) => {
    setActiveFY(fyLabel);
    setFinancialYears((prev) =>
      prev.map((fy) => ({ ...fy, isCurrent: fy.label === fyLabel }))
    );

    const target = financialYears.find((f) => f.label === fyLabel);
    if (isBackendConnected && target?._id) {
      try {
        await api.financialYears.setActive(target._id);
      } catch (err) {
        console.warn('Backend active FY update error:', err.message);
      }
    }

    addToast({
      type: 'success',
      title: 'Active Financial Year Changed',
      message: `Global context switched to FY ${fyLabel}`,
    });
  };

  // FY CRUD
  const addFinancialYear = async (fyData) => {
    try {
      if (isBackendConnected) {
        const res = await api.financialYears.create(fyData);
        const newFy = normalizeDoc(res.data);
        setFinancialYears((prev) => [newFy, ...prev]);
        addToast({
          type: 'success',
          title: 'Financial Year Created (MongoDB)',
          message: `FY ${newFy.label} stored in MongoDB database.`,
        });
        return newFy;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'API Error', message: err.message });
      return null;
    }

    // Local fallback
    const newFy = { id: generateId('fy'), ...fyData, isCurrent: financialYears.length === 0 };
    setFinancialYears((prev) => [newFy, ...prev]);
    addToast({ type: 'success', title: 'Financial Year Created', message: `FY ${newFy.label} registered.` });
    return newFy;
  };

  const updateFinancialYear = async (id, fyData) => {
    try {
      if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
        const res = await api.financialYears.update(id, fyData);
        const updated = normalizeDoc(res.data);
        setFinancialYears((prev) => prev.map((item) => (item.id === id || item._id === id ? updated : item)));
        addToast({ type: 'success', title: 'FY Updated (MongoDB)', message: 'Record updated in database.' });
        return;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Update Error', message: err.message });
      return;
    }

    setFinancialYears((prev) => prev.map((item) => (item.id === id ? { ...item, ...fyData } : item)));
    addToast({ type: 'success', title: 'Financial Year Updated', message: 'Details saved.' });
  };

  const deleteFinancialYear = async (id) => {
    const target = financialYears.find((f) => f.id === id || f._id === id);
    if (target?.isCurrent) {
      addToast({
        type: 'error',
        title: 'Cannot Delete Active FY',
        message: 'Please activate another financial year before deleting this one.',
      });
      return false;
    }

    try {
      if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
        await api.financialYears.delete(id);
        setFinancialYears((prev) => prev.filter((item) => item.id !== id && item._id !== id));
        addToast({ type: 'warning', title: 'FY Deleted (MongoDB)', message: `FY ${target?.label || ''} removed from database.` });
        return true;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Delete Error', message: err.message });
      return false;
    }

    setFinancialYears((prev) => prev.filter((item) => item.id !== id));
    addToast({ type: 'warning', title: 'Financial Year Deleted', message: `FY ${target?.label || ''} removed.` });
    return true;
  };

  // Subdivision CRUD
  const addSubdivision = async (subData) => {
    try {
      if (isBackendConnected) {
        const res = await api.subdivisions.create(subData);
        const newSub = normalizeDoc(res.data);
        setSubdivisions((prev) => [...prev, newSub]);
        addToast({ type: 'success', title: 'Subdivision Created (MongoDB)', message: `${newSub.name} saved in database.` });
        return newSub;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'API Error', message: err.message });
      return null;
    }

    const newSub = { id: generateId('sub'), ...subData };
    setSubdivisions((prev) => [...prev, newSub]);
    addToast({ type: 'success', title: 'Subdivision Added', message: `${newSub.name} registered.` });
    return newSub;
  };

  const updateSubdivision = async (id, subData) => {
    try {
      if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
        const res = await api.subdivisions.update(id, subData);
        const updated = normalizeDoc(res.data);
        setSubdivisions((prev) => prev.map((item) => (item.id === id || item._id === id ? updated : item)));
        addToast({ type: 'success', title: 'Subdivision Updated (MongoDB)', message: 'Details saved in database.' });
        return;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Update Error', message: err.message });
      return;
    }

    setSubdivisions((prev) => prev.map((item) => (item.id === id ? { ...item, ...subData } : item)));
    addToast({ type: 'success', title: 'Subdivision Updated', message: 'Details saved.' });
  };

  const deleteSubdivision = async (id) => {
    try {
      if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
        await api.subdivisions.delete(id);
        setSubdivisions((prev) => prev.filter((item) => item.id !== id && item._id !== id));
        addToast({ type: 'warning', title: 'Subdivision Deleted (MongoDB)', message: 'Record removed from database.' });
        return true;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Delete Error', message: err.message });
      return false;
    }

    setSubdivisions((prev) => prev.filter((item) => item.id !== id));
    addToast({ type: 'warning', title: 'Subdivision Removed', message: 'Subdivision deleted.' });
    return true;
  };

  // Work Order CRUD
  const addWorkOrder = async (woData) => {
    try {
      if (isBackendConnected) {
        const payload = {
          ...woData,
          subdivision: woData.subdivisionId && woData.subdivisionId.length === 24 ? woData.subdivisionId : null,
        };
        const res = await api.workOrders.create(payload);
        const newWo = normalizeDoc(res.data);
        setWorkOrders((prev) => [newWo, ...prev]);
        addToast({
          type: 'success',
          title: 'Work Order Created (MongoDB)',
          message: `Work Order ${newWo.workOrderNumber} persisted to database.`,
        });
        return newWo;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Validation / API Error', message: err.message });
      return null;
    }

    const newWo = { id: generateId('wo'), ...woData };
    setWorkOrders((prev) => [newWo, ...prev]);
    addToast({ type: 'success', title: 'Work Order Created', message: `Work Order ${newWo.workOrderNumber} created.` });
    return newWo;
  };

  const updateWorkOrder = async (id, woData) => {
    try {
      if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
        const payload = {
          ...woData,
          subdivision: woData.subdivisionId && woData.subdivisionId.length === 24 ? woData.subdivisionId : null,
        };
        const res = await api.workOrders.update(id, payload);
        const updated = normalizeDoc(res.data);
        setWorkOrders((prev) => prev.map((item) => (item.id === id || item._id === id ? updated : item)));
        addToast({ type: 'success', title: 'Work Order Updated (MongoDB)', message: 'Changes saved in database.' });
        return;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Update Error', message: err.message });
      return;
    }

    setWorkOrders((prev) => prev.map((item) => (item.id === id ? { ...item, ...woData } : item)));
    addToast({ type: 'success', title: 'Work Order Updated', message: 'Changes saved.' });
  };

  const deleteWorkOrder = async (id) => {
    try {
      if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
        await api.workOrders.delete(id);
        setWorkOrders((prev) => prev.filter((item) => item.id !== id && item._id !== id));
        addToast({ type: 'warning', title: 'Work Order Deleted (MongoDB)', message: 'Record deleted from database.' });
        return true;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Delete Error', message: err.message });
      return false;
    }

    setWorkOrders((prev) => prev.filter((item) => item.id !== id));
    addToast({ type: 'warning', title: 'Work Order Deleted', message: 'Work Order removed.' });
    return true;
  };

  // Agreement CRUD
  const addAgreement = async (agrData) => {
    try {
      if (isBackendConnected) {
        const payload = {
          ...agrData,
          workOrder: agrData.workOrderId && agrData.workOrderId.length === 24 ? agrData.workOrderId : workOrders[0]?._id,
        };
        const res = await api.agreements.create(payload);
        const newAgr = normalizeDoc(res.data);
        setAgreements((prev) => [newAgr, ...prev]);
        addToast({ type: 'success', title: 'Agreement Created (MongoDB)', message: `Agreement ${newAgr.agreementNumber} stored in database.` });
        return newAgr;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'API Error', message: err.message });
      return null;
    }

    const newAgr = { id: generateId('agr'), ...agrData };
    setAgreements((prev) => [newAgr, ...prev]);
    addToast({ type: 'success', title: 'Agreement Registered', message: `Agreement ${newAgr.agreementNumber} created.` });
    return newAgr;
  };

  const updateAgreement = async (id, agrData) => {
    try {
      if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
        const res = await api.agreements.update(id, agrData);
        const updated = normalizeDoc(res.data);
        setAgreements((prev) => prev.map((item) => (item.id === id || item._id === id ? updated : item)));
        addToast({ type: 'success', title: 'Agreement Updated (MongoDB)', message: 'Agreement updated in database.' });
        return;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Update Error', message: err.message });
      return;
    }

    setAgreements((prev) => prev.map((item) => (item.id === id ? { ...item, ...agrData } : item)));
    addToast({ type: 'success', title: 'Agreement Updated', message: 'Agreement details updated.' });
  };

  const deleteAgreement = async (id) => {
    try {
      if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
        await api.agreements.delete(id);
        setAgreements((prev) => prev.filter((item) => item.id !== id && item._id !== id));
        addToast({ type: 'warning', title: 'Agreement Deleted (MongoDB)', message: 'Agreement deleted from database.' });
        return true;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Delete Error', message: err.message });
      return false;
    }

    setAgreements((prev) => prev.filter((item) => item.id !== id));
    addToast({ type: 'warning', title: 'Agreement Removed', message: 'Agreement entry deleted.' });
    return true;
  };

  // Billing CRUD
  const addBilling = async (billData) => {
    try {
      if (isBackendConnected) {
        const payload = {
          ...billData,
          workOrder: billData.workOrderId && billData.workOrderId.length === 24 ? billData.workOrderId : workOrders[0]?._id,
          subdivision: billData.subdivisionId && billData.subdivisionId.length === 24 ? billData.subdivisionId : null,
        };
        const res = await api.billing.create(payload);
        const newBill = normalizeDoc(res.data);
        setBillingList((prev) => [newBill, ...prev]);
        addToast({ type: 'success', title: 'Bill Voucher Created (MongoDB)', message: `Invoice ${newBill.invoiceNumber} recorded in database.` });
        return newBill;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'API Error', message: err.message });
      return null;
    }

    const newBill = { id: generateId('bill'), ...billData };
    setBillingList((prev) => [newBill, ...prev]);
    addToast({ type: 'success', title: 'Bill Record Generated', message: `Invoice ${newBill.invoiceNumber} recorded.` });
    return newBill;
  };

  const updateBilling = async (id, billData) => {
    try {
      if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
        const res = await api.billing.update(id, billData);
        const updated = normalizeDoc(res.data);
        setBillingList((prev) => prev.map((item) => (item.id === id || item._id === id ? updated : item)));
        addToast({ type: 'success', title: 'Bill Updated (MongoDB)', message: 'Invoice updated in database.' });
        return;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Update Error', message: err.message });
      return;
    }

    setBillingList((prev) => prev.map((item) => (item.id === id ? { ...item, ...billData } : item)));
    addToast({ type: 'success', title: 'Bill Updated', message: 'Invoice updated.' });
  };

  const deleteBilling = async (id) => {
    try {
      if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
        await api.billing.delete(id);
        setBillingList((prev) => prev.filter((item) => item.id !== id && item._id !== id));
        addToast({ type: 'warning', title: 'Bill Deleted (MongoDB)', message: 'Invoice removed from database.' });
        return true;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Delete Error', message: err.message });
      return false;
    }

    setBillingList((prev) => prev.filter((item) => item.id !== id));
    addToast({ type: 'warning', title: 'Bill Deleted', message: 'Invoice removed.' });
    return true;
  };

  // FMD / SD Actions
  const updateFmdItem = async (id, fmdData) => {
    try {
      if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
        const res = await api.fmdSd.update(id, fmdData);
        const updated = normalizeDoc(res.data);
        setFmdList((prev) => prev.map((item) => (item.id === id || item._id === id ? updated : item)));
        addToast({ type: 'success', title: 'FMD / SD Updated (MongoDB)', message: 'FMD record updated in database.' });
        return;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Update Error', message: err.message });
      return;
    }

    setFmdList((prev) => prev.map((item) => (item.id === id ? { ...item, ...fmdData } : item)));
    addToast({ type: 'success', title: 'FMD / SD Updated', message: 'Details updated.' });
  };

  const addFmdDocument = async (fmdId, docFile) => {
    const docMeta = {
      name: docFile.name,
      size: `${(docFile.size / 1024).toFixed(1)} KB`,
      type: docFile.type || 'application/pdf',
    };

    try {
      if (isBackendConnected && (fmdId.length === 24 || fmdId.match(/^[0-9a-fA-F]{24}$/))) {
        const res = await api.fmdSd.addDocument(fmdId, docMeta);
        const updated = normalizeDoc(res.data);
        setFmdList((prev) => prev.map((item) => (item.id === fmdId || item._id === fmdId ? updated : item)));
        addToast({
          type: 'success',
          title: 'Document Metadata Stored (MongoDB)',
          message: `"${docFile.name}" registered to tender custody.`,
        });
        return;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Upload Notice', message: err.message });
    }

    // Local fallback
    const newDoc = {
      id: generateId('doc'),
      ...docMeta,
      uploadedAt: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setFmdList((prev) =>
      prev.map((item) =>
        item.id === fmdId
          ? { ...item, uploadedDocuments: [...(item.uploadedDocuments || []), newDoc] }
          : item
      )
    );

    addToast({
      type: 'info',
      title: 'Document Upload Preview',
      message: `"${docFile.name}" added to session preview. Step 3 will link cloud binary storage.`,
    });
  };

  const removeFmdDocument = async (fmdId, docId) => {
    try {
      if (isBackendConnected && (fmdId.length === 24 || fmdId.match(/^[0-9a-fA-F]{24}$/))) {
        const res = await api.fmdSd.deleteDocument(fmdId, docId);
        const updated = normalizeDoc(res.data);
        setFmdList((prev) => prev.map((item) => (item.id === fmdId || item._id === fmdId ? updated : item)));
        addToast({ type: 'warning', title: 'Document Removed (MongoDB)', message: 'Document reference deleted.' });
        return;
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }

    setFmdList((prev) =>
      prev.map((item) =>
        item.id === fmdId
          ? { ...item, uploadedDocuments: (item.uploadedDocuments || []).filter((d) => d.id !== docId && d._id !== docId) }
          : item
      )
    );
    addToast({ type: 'warning', title: 'Document Removed', message: 'Document deleted from preview.' });
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

        isBackendConnected,
        isLoading,
        refreshData: syncWithBackend,
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
