import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateId } from '../utils/formatters';
import { api } from '../services/apiClient';
import { dataService } from '../services/dataService';

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
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([
    {
      id: 'step1-init',
      type: 'info',
      title: 'TenderFlow ERP Ready',
      message: 'Offline-first PWA foundation & IndexedDB storage active.',
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

  // 1. Primary Local Storage: Load all datasets from Dexie IndexedDB
  const loadLocalDatabase = async () => {
    try {
      setIsLoading(true);
      await dataService.initLocalStorage({
        financialYears: INITIAL_FINANCIAL_YEARS,
        subdivisions: INITIAL_SUBDIVISIONS,
        workOrders: INITIAL_WORK_ORDERS,
        agreements: INITIAL_AGREEMENTS,
        billingList: INITIAL_BILLING,
        fmdList: INITIAL_FMD_SD,
      });

      const localData = await dataService.loadAllFromLocal();
      if (localData.financialYears?.length > 0) {
        setFinancialYears(localData.financialYears);
        const current = localData.financialYears.find((f) => f.isCurrent);
        if (current) setActiveFY(current.label);
      }
      if (localData.subdivisions?.length > 0) setSubdivisions(localData.subdivisions);
      if (localData.workOrders?.length > 0) setWorkOrders(localData.workOrders);
      if (localData.agreements?.length > 0) setAgreements(localData.agreements);
      if (localData.billingList?.length > 0) setBillingList(localData.billingList);
      if (localData.fmdList?.length > 0) setFmdList(localData.fmdList);
      return localData;
    } catch (err) {
      console.warn('[AppContext] Failed to load local IndexedDB data:', err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Re-read local IndexedDB and update React state
  const refreshLocalData = async () => {
    return await loadLocalDatabase();
  };

  // 2. Health check to determine backend connectivity WITHOUT blind automatic overwriting.
  // Full synchronization is explicit and user-controlled via CloudSyncModal.
  const checkBackendConnectivity = async () => {
    try {
      const health = await api.health.check();
      const isHealthy = health?.status === 'healthy';
      setIsBackendConnected(isHealthy);
      return isHealthy;
    } catch (err) {
      setIsBackendConnected(false);
      console.warn('[AppContext] Running in offline standalone mode:', err.message);
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadLocalDatabase();
      await checkBackendConnectivity();
    };
    init();
  }, []);

  // Switch Active FY
  const handleSetActiveFY = async (fyLabel) => {
    setActiveFY(fyLabel);
    setFinancialYears((prev) =>
      prev.map((fy) => ({ ...fy, isCurrent: fy.label === fyLabel }))
    );

    const target = financialYears.find((f) => f.label === fyLabel);
    if (target?.id) {
      try {
        await dataService.local.financialYears.setActive(target.id);
      } catch (err) {
        console.warn('Local active FY update error:', err.message);
      }
    }

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

  // 1. Financial Year CRUD
  const addFinancialYear = async (fyData) => {
    const newFy = {
      id: generateId('fy'),
      ...fyData,
      isCurrent: financialYears.length === 0,
    };

    // Primary write to local Dexie IndexedDB
    try {
      await dataService.local.financialYears.create(newFy);
    } catch (err) {
      console.warn('IndexedDB write error:', err.message);
    }

    // Secondary sync if online
    if (isBackendConnected) {
      try {
        const res = await api.financialYears.create(fyData);
        if (res?.data?._id) {
          newFy._id = res.data._id;
          await dataService.local.financialYears.update(newFy.id, { _id: res.data._id });
        }
      } catch (err) {
        console.warn('Backend create error, saved locally:', err.message);
      }
    }

    setFinancialYears((prev) => [newFy, ...prev]);
    addToast({
      type: 'success',
      title: 'Financial Year Created',
      message: `FY ${newFy.label} saved in local storage${isBackendConnected ? ' & cloud' : ''}.`,
    });
    return newFy;
  };

  const updateFinancialYear = async (id, fyData) => {
    try {
      await dataService.local.financialYears.update(id, fyData);
    } catch (err) {
      console.warn('IndexedDB update error:', err.message);
    }

    if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
      try {
        await api.financialYears.update(id, fyData);
      } catch (err) {
        console.warn('Backend update error, saved locally:', err.message);
      }
    }

    setFinancialYears((prev) => prev.map((item) => (item.id === id || item._id === id ? { ...item, ...fyData } : item)));
    addToast({ type: 'success', title: 'Financial Year Updated', message: 'Details saved to IndexedDB.' });
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
      await dataService.local.financialYears.delete(target?.id || id);
    } catch (err) {
      console.warn('IndexedDB delete error:', err.message);
    }

    if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
      try {
        await api.financialYears.delete(id);
      } catch (err) {
        console.warn('Backend delete error:', err.message);
      }
    }

    setFinancialYears((prev) => prev.filter((item) => item.id !== id && item._id !== id));
    addToast({ type: 'warning', title: 'Financial Year Deleted', message: `FY ${target?.label || ''} removed.` });
    return true;
  };

  // 2. Subdivision CRUD
  const addSubdivision = async (subData) => {
    const newSub = { id: generateId('sub'), ...subData };

    try {
      await dataService.local.subdivisions.create(newSub);
    } catch (err) {
      console.warn('IndexedDB write error:', err.message);
    }

    if (isBackendConnected) {
      try {
        const res = await api.subdivisions.create(subData);
        if (res?.data?._id) {
          newSub._id = res.data._id;
          await dataService.local.subdivisions.update(newSub.id, { _id: res.data._id });
        }
      } catch (err) {
        console.warn('Backend create error, saved locally:', err.message);
      }
    }

    setSubdivisions((prev) => [...prev, newSub]);
    addToast({ type: 'success', title: 'Subdivision Added', message: `${newSub.name} saved in IndexedDB.` });
    return newSub;
  };

  const updateSubdivision = async (id, subData) => {
    try {
      await dataService.local.subdivisions.update(id, subData);
    } catch (err) {
      console.warn('IndexedDB update error:', err.message);
    }

    if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
      try {
        await api.subdivisions.update(id, subData);
      } catch (err) {
        console.warn('Backend update error:', err.message);
      }
    }

    setSubdivisions((prev) => prev.map((item) => (item.id === id || item._id === id ? { ...item, ...subData } : item)));
    addToast({ type: 'success', title: 'Subdivision Updated', message: 'Details saved in IndexedDB.' });
  };

  const deleteSubdivision = async (id) => {
    try {
      await dataService.local.subdivisions.delete(id);
    } catch (err) {
      console.warn('IndexedDB delete error:', err.message);
    }

    if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
      try {
        await api.subdivisions.delete(id);
      } catch (err) {
        console.warn('Backend delete error:', err.message);
      }
    }

    setSubdivisions((prev) => prev.filter((item) => item.id !== id && item._id !== id));
    addToast({ type: 'warning', title: 'Subdivision Removed', message: 'Subdivision deleted from local storage.' });
    return true;
  };

  // 3. Work Order CRUD
  const addWorkOrder = async (woData) => {
    const newWo = { id: generateId('wo'), ...woData };

    try {
      await dataService.local.workOrders.create(newWo);
    } catch (err) {
      console.warn('IndexedDB write error:', err.message);
    }

    if (isBackendConnected) {
      try {
        const payload = {
          ...woData,
          subdivision: woData.subdivisionId && woData.subdivisionId.length === 24 ? woData.subdivisionId : null,
        };
        const res = await api.workOrders.create(payload);
        if (res?.data?._id) {
          newWo._id = res.data._id;
          await dataService.local.workOrders.update(newWo.id, { _id: res.data._id });
        }
      } catch (err) {
        console.warn('Backend create error, saved locally:', err.message);
      }
    }

    setWorkOrders((prev) => [newWo, ...prev]);
    addToast({
      type: 'success',
      title: 'Work Order Created',
      message: `Work Order ${newWo.workOrderNumber} saved in IndexedDB.`,
    });
    return newWo;
  };

  const updateWorkOrder = async (id, woData) => {
    try {
      await dataService.local.workOrders.update(id, woData);
    } catch (err) {
      console.warn('IndexedDB update error:', err.message);
    }

    if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
      try {
        const payload = {
          ...woData,
          subdivision: woData.subdivisionId && woData.subdivisionId.length === 24 ? woData.subdivisionId : null,
        };
        await api.workOrders.update(id, payload);
      } catch (err) {
        console.warn('Backend update error, saved locally:', err.message);
      }
    }

    setWorkOrders((prev) => prev.map((item) => (item.id === id || item._id === id ? { ...item, ...woData } : item)));
    addToast({ type: 'success', title: 'Work Order Updated', message: 'Changes saved to local storage.' });
  };

  const deleteWorkOrder = async (id) => {
    try {
      await dataService.local.workOrders.delete(id);
    } catch (err) {
      console.warn('IndexedDB delete error:', err.message);
    }

    if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
      try {
        await api.workOrders.delete(id);
      } catch (err) {
        console.warn('Backend delete error:', err.message);
      }
    }

    setWorkOrders((prev) => prev.filter((item) => item.id !== id && item._id !== id));
    addToast({ type: 'warning', title: 'Work Order Deleted', message: 'Work Order removed from local storage.' });
    return true;
  };

  // 4. Agreement CRUD
  const addAgreement = async (agrData) => {
    const newAgr = { id: generateId('agr'), ...agrData };

    try {
      await dataService.local.agreements.create(newAgr);
    } catch (err) {
      console.warn('IndexedDB write error:', err.message);
    }

    if (isBackendConnected) {
      try {
        const payload = {
          ...agrData,
          workOrder: agrData.workOrderId && agrData.workOrderId.length === 24 ? agrData.workOrderId : workOrders[0]?._id,
        };
        const res = await api.agreements.create(payload);
        if (res?.data?._id) {
          newAgr._id = res.data._id;
          await dataService.local.agreements.update(newAgr.id, { _id: res.data._id });
        }
      } catch (err) {
        console.warn('Backend create error, saved locally:', err.message);
      }
    }

    setAgreements((prev) => [newAgr, ...prev]);
    addToast({
      type: 'success',
      title: 'Agreement Registered',
      message: `Agreement ${newAgr.agreementNumber} saved in IndexedDB.`,
    });
    return newAgr;
  };

  const updateAgreement = async (id, agrData) => {
    try {
      await dataService.local.agreements.update(id, agrData);
    } catch (err) {
      console.warn('IndexedDB update error:', err.message);
    }

    if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
      try {
        await api.agreements.update(id, agrData);
      } catch (err) {
        console.warn('Backend update error, saved locally:', err.message);
      }
    }

    setAgreements((prev) => prev.map((item) => (item.id === id || item._id === id ? { ...item, ...agrData } : item)));
    addToast({ type: 'success', title: 'Agreement Updated', message: 'Agreement details updated in storage.' });
  };

  const deleteAgreement = async (id) => {
    try {
      await dataService.local.agreements.delete(id);
    } catch (err) {
      console.warn('IndexedDB delete error:', err.message);
    }

    if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
      try {
        await api.agreements.delete(id);
      } catch (err) {
        console.warn('Backend delete error:', err.message);
      }
    }

    setAgreements((prev) => prev.filter((item) => item.id !== id && item._id !== id));
    addToast({ type: 'warning', title: 'Agreement Removed', message: 'Agreement entry deleted from local storage.' });
    return true;
  };

  // 5. Billing CRUD
  const addBilling = async (billData) => {
    const newBill = { id: generateId('bill'), ...billData };

    try {
      await dataService.local.billing.create(newBill);
    } catch (err) {
      console.warn('IndexedDB write error:', err.message);
    }

    if (isBackendConnected) {
      try {
        const payload = {
          ...billData,
          workOrder: billData.workOrderId && billData.workOrderId.length === 24 ? billData.workOrderId : workOrders[0]?._id,
          subdivision: billData.subdivisionId && billData.subdivisionId.length === 24 ? billData.subdivisionId : null,
        };
        const res = await api.billing.create(payload);
        if (res?.data?._id) {
          newBill._id = res.data._id;
          await dataService.local.billing.update(newBill.id, { _id: res.data._id });
        }
      } catch (err) {
        console.warn('Backend create error, saved locally:', err.message);
      }
    }

    setBillingList((prev) => [newBill, ...prev]);
    addToast({
      type: 'success',
      title: 'Bill Record Generated',
      message: `Invoice ${newBill.invoiceNumber || newBill.billNumber} saved in IndexedDB.`,
    });
    return newBill;
  };

  const updateBilling = async (id, billData) => {
    try {
      await dataService.local.billing.update(id, billData);
    } catch (err) {
      console.warn('IndexedDB update error:', err.message);
    }

    if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
      try {
        await api.billing.update(id, billData);
      } catch (err) {
        console.warn('Backend update error, saved locally:', err.message);
      }
    }

    setBillingList((prev) => prev.map((item) => (item.id === id || item._id === id ? { ...item, ...billData } : item)));
    addToast({ type: 'success', title: 'Bill Updated', message: 'Invoice details updated in storage.' });
  };

  const deleteBilling = async (id) => {
    try {
      await dataService.local.billing.delete(id);
    } catch (err) {
      console.warn('IndexedDB delete error:', err.message);
    }

    if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
      try {
        await api.billing.delete(id);
      } catch (err) {
        console.warn('Backend delete error:', err.message);
      }
    }

    setBillingList((prev) => prev.filter((item) => item.id !== id && item._id !== id));
    addToast({ type: 'warning', title: 'Bill Deleted', message: 'Invoice removed from storage.' });
    return true;
  };

  // 6. FMD / SD Actions
  const addFmdItem = async (fmdData) => {
    const newItem = {
      id: generateId('fmd'),
      ...fmdData,
      uploadedDocuments: fmdData.uploadedDocuments || [],
    };

    try {
      await dataService.local.fmdSd.create(newItem);
    } catch (err) {
      console.warn('IndexedDB write error:', err.message);
    }

    if (isBackendConnected) {
      try {
        const payload = {
          ...fmdData,
          workOrder: fmdData.workOrderId && fmdData.workOrderId.length === 24 ? fmdData.workOrderId : null,
        };
        const res = await api.fmdSd.create(payload);
        if (res?.data?._id) {
          newItem._id = res.data._id;
          await dataService.local.fmdSd.update(newItem.id, { _id: res.data._id });
        }
      } catch (err) {
        console.warn('Backend create error, saved locally:', err.message);
      }
    }

    setFmdList((prev) => [newItem, ...prev]);
    addToast({
      type: 'success',
      title: 'FMD / SD Registered',
      message: `Record for ${newItem.tenderNumber} saved in IndexedDB.`,
    });
    return newItem;
  };

  const updateFmdItem = async (id, fmdData) => {
    try {
      await dataService.local.fmdSd.update(id, fmdData);
    } catch (err) {
      console.warn('IndexedDB update error:', err.message);
    }

    if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
      try {
        await api.fmdSd.update(id, fmdData);
      } catch (err) {
        console.warn('Backend update error, saved locally:', err.message);
      }
    }

    setFmdList((prev) => prev.map((item) => (item.id === id || item._id === id ? { ...item, ...fmdData } : item)));
    addToast({ type: 'success', title: 'FMD / SD Updated', message: 'Details updated in IndexedDB.' });
  };

  const deleteFmdItem = async (id) => {
    try {
      await dataService.local.fmdSd.delete(id);
    } catch (err) {
      console.warn('IndexedDB delete error:', err.message);
    }

    if (isBackendConnected && (id.length === 24 || id.match(/^[0-9a-fA-F]{24}$/))) {
      try {
        await api.fmdSd.delete(id);
      } catch (err) {
        console.warn('Backend delete error:', err.message);
      }
    }

    setFmdList((prev) => prev.filter((item) => item.id !== id && item._id !== id));
    addToast({ type: 'warning', title: 'FMD Record Deleted', message: 'Record removed from local storage.' });
    return true;
  };

  const addFmdDocument = async (fmdId, docFile) => {
    // Read file as base64 data URL for offline persistence in IndexedDB
    const readDataUrl = (file) =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });

    const dataUrl = await readDataUrl(docFile);

    const newDoc = {
      id: generateId('doc'),
      name: docFile.name,
      size: `${(docFile.size / 1024).toFixed(1)} KB`,
      type: docFile.type || 'application/pdf',
      dataUrl,
      uploadedAt: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    // Update in React State
    setFmdList((prev) =>
      prev.map((item) =>
        item.id === fmdId || item._id === fmdId
          ? { ...item, uploadedDocuments: [...(item.uploadedDocuments || []), newDoc] }
          : item
      )
    );

    // Update in local Dexie IndexedDB
    try {
      const fmdRecord = await dataService.local.fmdSd.getById(fmdId);
      if (fmdRecord) {
        const docs = [...(fmdRecord.uploadedDocuments || []), newDoc];
        await dataService.local.fmdSd.update(fmdId, { uploadedDocuments: docs });
      }
    } catch (err) {
      console.warn('IndexedDB document update error:', err.message);
    }

    // Secondary upload to server custody if online
    if (isBackendConnected && (fmdId.length === 24 || fmdId.match(/^[0-9a-fA-F]{24}$/))) {
      try {
        const res = await api.fmdSd.uploadFile(fmdId, docFile);
        const updated = normalizeDoc(res.data);
        setFmdList((prev) => prev.map((item) => (item.id === fmdId || item._id === fmdId ? updated : item)));
        addToast({
          type: 'success',
          title: 'Document Uploaded',
          message: `"${docFile.name}" stored in local storage & uploaded to server.`,
        });
        return;
      } catch (err) {
        console.warn('Server upload failed, preserved in local storage:', err.message);
      }
    }

    addToast({
      type: 'success',
      title: 'Document Saved Locally',
      message: `"${docFile.name}" stored in IndexedDB for offline access.`,
    });
  };

  const removeFmdDocument = async (fmdId, docId) => {
    setFmdList((prev) =>
      prev.map((item) =>
        item.id === fmdId || item._id === fmdId
          ? { ...item, uploadedDocuments: (item.uploadedDocuments || []).filter((d) => d.id !== docId && d._id !== docId) }
          : item
      )
    );

    try {
      const fmdRecord = await dataService.local.fmdSd.getById(fmdId);
      if (fmdRecord) {
        const docs = (fmdRecord.uploadedDocuments || []).filter((d) => d.id !== docId && d._id !== docId);
        await dataService.local.fmdSd.update(fmdId, { uploadedDocuments: docs });
      }
    } catch (err) {
      console.warn('IndexedDB document remove error:', err.message);
    }

    if (isBackendConnected && (fmdId.length === 24 || fmdId.match(/^[0-9a-fA-F]{24}$/))) {
      try {
        await api.fmdSd.deleteDocument(fmdId, docId);
      } catch (err) {
        console.warn('Server doc delete failed:', err.message);
      }
    }

    addToast({ type: 'warning', title: 'Document Removed', message: 'Document reference removed from storage.' });
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
        addFmdItem,
        updateFmdItem,
        deleteFmdItem,
        addFmdDocument,
        removeFmdDocument,

        toasts,
        addToast,
        removeToast,

        isBackendConnected,
        isLoading,
        refreshData: checkBackendConnectivity,
        refreshLocalData,
        isSyncModalOpen,
        setIsSyncModalOpen,
        openSyncModal: () => setIsSyncModalOpen(true),
        closeSyncModal: () => setIsSyncModalOpen(false),
        syncService: dataService.sync,
        dataService,
        repositories: dataService.local,
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
