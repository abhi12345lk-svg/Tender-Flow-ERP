# TenderFlow ERP — Government Works Management System

A production-quality Government Works Management ERP frontend built for Public Works Divisions, Municipal Corporations, and Infrastructure Authorities to streamline Work Orders, Agreements, Contractor Billing, Subdivisions, and Tender Security (FMD / SD) custody.

---

## 🏗️ Step 1 Architecture & Tech Stack

- **Framework**: React 18 with Vite
- **Language**: JavaScript (ESModules) — *no TypeScript*
- **Styling**: Tailwind CSS with custom government design tokens (Dark Navy `#070d1e`, Gov Blue `#1d4ed8`, Slate `#f8fafc`)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Typography**: Inter (Google Fonts)

---

## 🏢 Business Modules (Exactly 6 Core Modules)

1. **Financial Year (`/financial-year`)**
   - Fiscal cycle configuration with start/end date boundary validation.
   - Global active Financial Year context switcher in Topbar.
   - In-memory government fiscal cycles (e.g. FY 2024-2025, 2025-2026, 2023-2024).

2. **Work Order (`/work-orders`)**
   - Preserves handwritten required fields and labels:
     - `Tender Number (M)`
     - `Work Order Number (M)`
     - `Work Order Date`
     - `TD` *(preserved label)*
     - `EMD Number` & `EMD Amount`
     - `Estimate Number`
     - `Work Order Amount` (₹ INR)
     - `SD Amount`
     - `Status / Options` (Draft, Issued, In Progress, Completed, Terminated)
     - `Financial Year` & `Subdivision` associations
   - Searchable, paginated data table with detailed modal viewer.

3. **Agreement (`/agreements`)**
   - Bind sanctioned Work Orders to legal contract templates:
     - PWD Form F-2 (Lump Sum Contract)
     - Item Rate Agreement Form B-1
     - EPC Turnkey Contract Template
   - E-Stamp Duty certificate tracking.
   - Document editing / clauses entry point.
   - Official government printable agreement modal with browser Print-to-PDF engine.
   - Client-side Word (.doc) draft export (clearly identified for Step 2 dynamic generator).

4. **Billing (`/billing`)**
   - Running Account (RA) & Final Bill vouchers:
     - Date of Completion & Date of Handover
     - Invoice Number & Date
     - Basic Amount (Excl. GST)
     - Configurable GST Rate (18% default: CGST 9% + SGST 9%) & auto-calculated Gross Total
     - Statutory Deduction Form:
       - Security Deposit (SD) Deduction (5%)
       - Income Tax TDS (2%)
       - Labour Cess (1%)
       - Royalty / Material Withholding
       - Penalties / Withheld
     - Net Payable Disbursable Calculation (Gross Total minus Statutory Deductions)
     - Related Work Order & Subdivision association.

5. **Subdivision (`/subdivisions`)**
   - Administrative sub-unit management:
     - Subdivision Name, Code, In-Charge Officer, Campus
     - Association inspection mapping linked Work Orders and Billing vouchers.
     - Integrity checks preventing deletion of active operational subdivisions.

6. **FMD / SD (`/fmd-sd`)**
   - Tender details and related Work Order references.
   - Keeps `FMD` as `FMD` without inventing fictitious names.
   - Instrument custody tracking: Bank Guarantee (BG), Fixed Deposit Receipt (FDR), Treasury Challan.
   - Bilingual Document / Print Format Entry Point with real-time **English / हिंदी (Hindi)** toggle.
   - Document upload interface with clear Step 1 preview banner (session storage preview; cloud S3 storage arriving in Step 2).

---

## 🚀 Setup & Execution

### 1. Prerequisites
- Node.js (v18+ recommended, verified on v24.11.1)
- npm (v9+ recommended, verified on v11.6.2)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/abhi12345lk-svg/Tender-Flow-ERP.git

# Enter project directory
cd "Tender Flow ERP"

# Install dependencies
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The application will be live at **`http://localhost:3000/`**.

### 4. Build for Production
```bash
npm run build
```
Generates optimized static bundle in `/dist` for deployment to Render or Vercel.

---

## 📁 Project Structure

```
d:/My project/Tender Flow ERP/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── README.md
├── .gitignore
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── components/
    │   ├── common/
    │   │   ├── Badge.jsx
    │   │   ├── Button.jsx
    │   │   ├── ConfirmDialog.jsx
    │   │   ├── DataTable.jsx
    │   │   ├── EmptyState.jsx
    │   │   ├── Input.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Pagination.jsx
    │   │   ├── Select.jsx
    │   │   └── Toast.jsx
    │   └── layout/
    │       ├── Breadcrumbs.jsx
    │       ├── Layout.jsx
    │       ├── Sidebar.jsx
    │       └── Topbar.jsx
    ├── context/
    │   └── AppContext.jsx
    ├── modules/
    │   ├── financial-year/
    │   │   ├── FinancialYearModal.jsx
    │   │   └── FinancialYearPage.jsx
    │   ├── work-orders/
    │   │   ├── WorkOrderDetailModal.jsx
    │   │   ├── WorkOrderModal.jsx
    │   │   └── WorkOrdersPage.jsx
    │   ├── agreements/
    │   │   ├── AgreementModal.jsx
    │   │   ├── AgreementPrintPreviewModal.jsx
    │   │   └── AgreementsPage.jsx
    │   ├── billing/
    │   │   ├── BillingDetailModal.jsx
    │   │   ├── BillingModal.jsx
    │   │   └── BillingPage.jsx
    │   ├── subdivisions/
    │   │   ├── SubdivisionModal.jsx
    │   │   └── SubdivisionsPage.jsx
    │   └── fmd-sd/
    │       ├── FmdSdModal.jsx
    │       ├── FmdSdPage.jsx
    │       └── FmdSdPrintModal.jsx
    ├── routes/
    │   └── AppRoutes.jsx
    ├── styles/
    │   └── index.css
    └── utils/
        └── formatters.js
```

---

## 📌 Step 1 Notice & Transition to Step 2
- **Step 1 Scope**: Complete frontend architecture, routing, design system, interactive state, data tables, modals, bilingual print formats, and validation rules.
- **Backend Persistence**: Express.js REST APIs and MongoDB Atlas integration will be implemented in Step 2.
