import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';

// Module Pages
import FinancialYearPage from '../modules/financial-year/FinancialYearPage';
import WorkOrdersPage from '../modules/work-orders/WorkOrdersPage';
import AgreementsPage from '../modules/agreements/AgreementsPage';
import BillingPage from '../modules/billing/BillingPage';
import SubdivisionsPage from '../modules/subdivisions/SubdivisionsPage';
import FmdSdPage from '../modules/fmd-sd/FmdSdPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Default route points to Work Orders */}
        <Route index element={<Navigate to="/work-orders" replace />} />
        
        {/* Exactly Six Business Modules */}
        <Route path="financial-year" element={<FinancialYearPage />} />
        <Route path="work-orders" element={<WorkOrdersPage />} />
        <Route path="agreements" element={<AgreementsPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="subdivisions" element={<SubdivisionsPage />} />
        <Route path="fmd-sd" element={<FmdSdPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/work-orders" replace />} />
      </Route>
    </Routes>
  );
}
