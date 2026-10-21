import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateId } from '../utils/formatters';
import { api } from '../services/apiClient';
import { dataService } from '../services/dataService';
import { auditService } from '../services/audit/auditService';

const AppContext = createContext(null);

const INITIAL_FINANCIAL_YEARS = [
  {
    id: 'fy-2024-25',
    label: '2024-2025',
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    status: 'Active',
    description: 'Current Operating Financial Year',
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
    code: 'DIV-01',
    name: 'Project Division I (Civil & Infrastructure)',
    inCharge: 'Division Manager',
    location: 'Main Operations Center',
    status: 'Active',
  },
  {
    id: 'sub-02',
    code: 'DIV-02',
    name: 'Project Division II (Electrical & MEP)',
    inCharge: 'Technical Lead',
    location: 'Site Operations',
    status: 'Active',
  },
];

const INITIAL_WORK_ORDERS = [];
const INITIAL_AGREEMENTS = [];
const INITIAL_BILLING = [];
const INITIAL_FMD_SD = [];

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
      if (localData.subdivisions?.length > 0) {
        setSubdivisions(localData.subdivisions);
      } else {
        setSubdivisions(INITIAL_SUBDIVISIONS);
      }
      setWorkOrders(localData.workOrders || []);
      setAgreements(localData.agreements || []);
      setBillingList(localData.billingList || []);
      setFmdList(localData.fmdList || []);
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

  // Switch Active FY (persists locally in Dexie IndexedDB)
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

    addToast({
      type: 'success',
      title: 'Active Financial Year Changed',
      message: `Global context switched to FY ${fyLabel}`,
    });
  };

  // 1. Financial Year CRUD (Local-First IndexedDB Persistence)
  const addFinancialYear = async (fyData) => {
    const newFy = {
      id: generateId('fy'),
      ...fyData,
      isCurrent: financialYears.length === 0,
    };

    try {
      await dataService.local.financialYears.create(newFy);
    } catch (err) {
      console.warn('IndexedDB write error:', err.message);
    }

    setFinancialYears((prev) => [newFy, ...prev]);
    addToast({
      type: 'success',
      title: 'Financial Year Created',
      message: `FY ${newFy.label} saved in local IndexedDB storage.`,
    });
    return newFy;
  };

  const updateFinancialYear = async (id, fyData) => {
    try {
      await dataService.local.financialYears.update(id, fyData);
    } catch (err) {
      console.warn('IndexedDB update error:', err.message);
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

    setFinancialYears((prev) => prev.filter((item) => item.id !== id && item._id !== id));
    addToast({ type: 'warning', title: 'Financial Year Deleted', message: `FY ${target?.label || ''} removed.` });
    return true;
  };

  // 2. Subdivision CRUD (Local-First IndexedDB Persistence)
  const addSubdivision = async (subData) => {
    const newSub = { id: generateId('sub'), ...subData };

    try {
      await dataService.local.subdivisions.create(newSub);
      await auditService.logCreate('subdivisions', newSub.id, newSub);
    } catch (err) {
      console.warn('IndexedDB write error:', err.message);
      await auditService.logFailure('subdivisions', newSub.id, 'CREATE', err);
    }

    setSubdivisions((prev) => [...prev, newSub]);
    addToast({ type: 'success', title: 'Subdivision Added', message: `${newSub.name} saved in IndexedDB.` });
    return newSub;
  };

  const updateSubdivision = async (id, subData) => {
    const oldItem = subdivisions.find((item) => item.id === id || item._id === id);
    try {
      await dataService.local.subdivisions.update(id, subData);
      await auditService.logUpdate('subdivisions', id, oldItem, subData);
    } catch (err) {
      console.warn('IndexedDB update error:', err.message);
      await auditService.logFailure('subdivisions', id, 'UPDATE', err);
    }

    setSubdivisions((prev) => prev.map((item) => (item.id === id || item._id === id ? { ...item, ...subData } : item)));
    addToast({ type: 'success', title: 'Subdivision Updated', message: 'Details saved in IndexedDB.' });
  };

  const deleteSubdivision = async (id) => {
    const target = subdivisions.find((item) => item.id === id || item._id === id);
    try {
      await dataService.local.subdivisions.delete(id);
      await auditService.logDelete('subdivisions', id, target);
    } catch (err) {
      console.warn('IndexedDB delete error:', err.message);
      await auditService.logFailure('subdivisions', id, 'DELETE', err);
    }

    setSubdivisions((prev) => prev.filter((item) => item.id !== id && item._id !== id));
    addToast({ type: 'warning', title: 'Subdivision Removed', message: 'Subdivision deleted from local storage.' });
    return true;
  };

  // 3. Work Order CRUD (Local-First IndexedDB Persistence)
  const addWorkOrder = async (woData) => {
    const newWo = { id: generateId('wo'), ...woData };

    try {
      await dataService.local.workOrders.create(newWo);
      await auditService.logCreate('workOrders', newWo.id, newWo);
    } catch (err) {
      console.warn('IndexedDB write error:', err.message);
      await auditService.logFailure('workOrders', newWo.id, 'CREATE', err);
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
    const oldItem = workOrders.find((item) => item.id === id || item._id === id);
    try {
      await dataService.local.workOrders.update(id, woData);
      await auditService.logUpdate('workOrders', id, oldItem, woData);
    } catch (err) {
      console.warn('IndexedDB update error:', err.message);
      await auditService.logFailure('workOrders', id, 'UPDATE', err);
    }

    setWorkOrders((prev) => prev.map((item) => (item.id === id || item._id === id ? { ...item, ...woData } : item)));
    addToast({ type: 'success', title: 'Work Order Updated', message: 'Changes saved to local storage.' });
  };

  const deleteWorkOrder = async (id) => {
    const target = workOrders.find((item) => item.id === id || item._id === id);
    try {
      await dataService.local.workOrders.delete(id);
      await auditService.logDelete('workOrders', id, target);
    } catch (err) {
      console.warn('IndexedDB delete error:', err.message);
      await auditService.logFailure('workOrders', id, 'DELETE', err);
    }

    setWorkOrders((prev) => prev.filter((item) => item.id !== id && item._id !== id));
    addToast({ type: 'warning', title: 'Work Order Deleted', message: 'Work Order removed from local storage.' });
    return true;
  };

  // 4. Agreement CRUD (Local-First IndexedDB Persistence)
  const addAgreement = async (agrData) => {
    const newAgr = { id: generateId('agr'), ...agrData };

    try {
      await dataService.local.agreements.create(newAgr);
      await auditService.logCreate('agreements', newAgr.id, newAgr);
    } catch (err) {
      console.warn('IndexedDB write error:', err.message);
      await auditService.logFailure('agreements', newAgr.id, 'CREATE', err);
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
    const oldItem = agreements.find((item) => item.id === id || item._id === id);
    try {
      await dataService.local.agreements.update(id, agrData);
      await auditService.logUpdate('agreements', id, oldItem, agrData);
    } catch (err) {
      console.warn('IndexedDB update error:', err.message);
      await auditService.logFailure('agreements', id, 'UPDATE', err);
    }

    setAgreements((prev) => prev.map((item) => (item.id === id || item._id === id ? { ...item, ...agrData } : item)));
    addToast({ type: 'success', title: 'Agreement Updated', message: 'Agreement details updated in storage.' });
  };

  const deleteAgreement = async (id) => {
    const target = agreements.find((item) => item.id === id || item._id === id);
    try {
      await dataService.local.agreements.delete(id);
      await auditService.logDelete('agreements', id, target);
    } catch (err) {
      console.warn('IndexedDB delete error:', err.message);
      await auditService.logFailure('agreements', id, 'DELETE', err);
    }

    setAgreements((prev) => prev.filter((item) => item.id !== id && item._id !== id));
    addToast({ type: 'warning', title: 'Agreement Removed', message: 'Agreement entry deleted from local storage.' });
    return true;
  };

  // 5. Billing CRUD (Local-First IndexedDB Persistence)
  const addBilling = async (billData) => {
    const newBill = { id: generateId('bill'), ...billData };

    try {
      await dataService.local.billing.create(newBill);
      await auditService.logCreate('billing', newBill.id, newBill);
    } catch (err) {
      console.warn('IndexedDB write error:', err.message);
      await auditService.logFailure('billing', newBill.id, 'CREATE', err);
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
    const oldItem = billingList.find((item) => item.id === id || item._id === id);
    try {
      await dataService.local.billing.update(id, billData);
      await auditService.logUpdate('billing', id, oldItem, billData);
    } catch (err) {
      console.warn('IndexedDB update error:', err.message);
      await auditService.logFailure('billing', id, 'UPDATE', err);
    }

    setBillingList((prev) => prev.map((item) => (item.id === id || item._id === id ? { ...item, ...billData } : item)));
    addToast({ type: 'success', title: 'Bill Updated', message: 'Invoice details updated in storage.' });
  };

  const deleteBilling = async (id) => {
    const target = billingList.find((item) => item.id === id || item._id === id);
    try {
      await dataService.local.billing.delete(id);
      await auditService.logDelete('billing', id, target);
    } catch (err) {
      console.warn('IndexedDB delete error:', err.message);
      await auditService.logFailure('billing', id, 'DELETE', err);
    }

    setBillingList((prev) => prev.filter((item) => item.id !== id && item._id !== id));
    addToast({ type: 'warning', title: 'Bill Deleted', message: 'Invoice removed from storage.' });
    return true;
  };

  // 6. FMD / SD Actions (Local-First IndexedDB Persistence)
  const addFmdItem = async (fmdData) => {
    const newItem = {
      id: generateId('fmd'),
      ...fmdData,
      uploadedDocuments: fmdData.uploadedDocuments || [],
    };

    try {
      await dataService.local.fmdSd.create(newItem);
      await auditService.logCreate('fmdSd', newItem.id, newItem);
    } catch (err) {
      console.warn('IndexedDB write error:', err.message);
      await auditService.logFailure('fmdSd', newItem.id, 'CREATE', err);
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
    const oldItem = fmdList.find((item) => item.id === id || item._id === id);
    try {
      await dataService.local.fmdSd.update(id, fmdData);
      await auditService.logUpdate('fmdSd', id, oldItem, fmdData);
    } catch (err) {
      console.warn('IndexedDB update error:', err.message);
      await auditService.logFailure('fmdSd', id, 'UPDATE', err);
    }

    setFmdList((prev) => prev.map((item) => (item.id === id || item._id === id ? { ...item, ...fmdData } : item)));
    addToast({ type: 'success', title: 'FMD / SD Updated', message: 'Details updated in IndexedDB.' });
  };

  const deleteFmdItem = async (id) => {
    const target = fmdList.find((item) => item.id === id || item._id === id);
    try {
      await dataService.local.fmdSd.delete(id);
      await auditService.logDelete('fmdSd', id, target);
    } catch (err) {
      console.warn('IndexedDB delete error:', err.message);
      await auditService.logFailure('fmdSd', id, 'DELETE', err);
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

    addToast({ type: 'warning', title: 'Document Removed', message: 'Document reference removed from local storage.' });
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
