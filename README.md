# TenderFlow ERP — Government Works Management System

A production-quality Government Works Management ERP built for Public Works Divisions, Municipal Corporations, and Infrastructure Authorities to streamline Work Orders, Agreements, Contractor Billing, Subdivisions, and Tender Security (FMD / SD) custody.

---

## 🏗️ Architecture & Technology Stack

### Target Architecture (Offline-First Migration):
- **Web App Hosting**: Vercel (Production Static SPA & PWA CDN)
- **Backend API**: Node.js & Express on Render (where required for central cloud storage and authentication)
- **Offline Storage**: IndexedDB via **Dexie.js** repositories for local business records
- **Service Worker / PWA**: Vite PWA plugin with Workbox versioned asset precaching, offline navigation fallback, and safe update notifications
- **Document Generation**: Offline browser printing (PDF) + Client & Server document generation (DOCX, PDF, XLSX)
- **Modules**: Strictly the **six existing business modules** (Financial Year, Work Order, Agreement, Billing, Subdivision, FMD / SD)

```
React 18 UI (Vite + Tailwind CSS + Lucide)
   │
   ├── Data Services / Repositories
   │      └── IndexedDB via Dexie.js (Offline-First Local Business Records)
   │
   └── Optional Server Services (When Online)
          └── Express REST API on Render ── MongoDB Atlas (Central Cloud Storage)
```

### Local-First Persistence & Storage (Step 2 Migration):
- **Primary Database Engine**: IndexedDB via `Dexie.js` (`TenderFlowERP_DB`) stores records across all six modules with indexed query fields.
- **Offline Durability**: All CRUD operations write immediately to local Dexie repositories. Changes survive full browser reloads, cache clears, and offline restarts.
- **Offline Relations Resolution**: Work Orders dynamically resolve linked Agreements, Billing vouchers, and FMD / SD records locally in IndexedDB to compute financial realization progress bars without server calls.
- **Offline Attachment Handling**: Uploaded documents are preserved offline via Base64 DataURLs in IndexedDB records for immediate downloading and viewing.
- **Data Portability & Sovereign Backup**: Built-in JSON export and import allows government officers to download timestamped database backups (`.json`) and restore them safely into IndexedDB.

---

## 🏢 Business Modules (Exactly 6 Core Modules)

1. **Financial Year (`/api/v1/financial-years`)**
   - Fiscal cycle configuration with start/end date range boundary validation.
   - Non-overlapping date range protection.
   - Global active Financial Year context switcher in Topbar and API.
   - Historical record preservation; no silent record shifting across years.

2. **Work Order (`/api/v1/work-orders`)**
   - Preserves handwritten specifications and unconfirmed labels:
     - `Tender Number (M)` *(mandatory)*
     - `Work Order Number (M)` *(mandatory, unique index)*
     - `Work Order Date`
     - `TD` *(preserved label)*
     - `EMD Number` & `EMD Amount`
     - `Estimate Number`
     - `Work Order Amount` (₹ INR)
     - `SD Amount`
     - `Status / Options` (`Draft`, `Issued`, `In Progress`, `Completed`, `Terminated`)
     - `Financial Year` & `Subdivision` associations
   - Search, filter by status / subdivision / financial year, and pagination.
   - Detail view modal showing linked Agreements, Billing vouchers, FMD security records, and financial realization progress bar.

3. **Agreement (`/api/v1/agreements`)**
   - Bind sanctioned Work Orders to legal contract templates:
     - Standard PWD Form F-2 (Lump Sum)
     - Item Rate Agreement Form B-1
     - EPC Turnkey Contract Template
   - E-Stamp Duty certificate tracking.
   - Contract clauses entry point.
   - Official government printable agreement modal with browser Print-to-PDF engine.
   - Server-side Microsoft Word (`.doc`) document generation (`GET /api/v1/agreements/:id/docx`) populated with live MongoDB Work Order data.

4. **Billing (`/api/v1/billing`)**
   - Running Account (RA) & Final Bill vouchers:
     - `Date of Completion` & `Date of Handover`
     - `Invoice Number` (unique) & `Invoice Date`
     - `Basic Amount` (Excl. GST)
     - `Configurable GST Rate` (default 18%: CGST 9% + SGST 9%) & auto-calculated Gross Total
     - `Statutory Deduction Form`: Security Deposit (5%), IT-TDS (2%), Labour Cess (1%), Royalty, Penalties
     - `Net Payable Disbursable Calculation` (Gross Total minus Statutory Deductions)
     - Related Work Order & Subdivision association.
     - Automatic calculation guard preventing silent saving of miscalculated totals.

5. **Subdivision (`/api/v1/subdivisions`)**
   - Administrative sub-unit management:
     - Subdivision Name, Code, In-Charge Officer, Campus
     - Linked Work Orders and Billing vouchers inspection.
     - Integrity checks preventing deletion of active operational subdivisions.

6. **FMD / SD (`/api/v1/fmd-sd`)**
   - Preserved strictly as **FMD / SD** without inventing fictitious names.
   - Financial security instrument custody: Bank Guarantee (BG), Fixed Deposit Receipt (FDR), Treasury Challan.
   - **Bilingual Document / Print Format**: Real-time **English / हिंदी (Hindi)** toggle.
   - Official bilingual Word (`.doc`) custody certificate generator (`GET /api/v1/fmd-sd/:id/docx?lang=hi|en`) with full Unicode font support.
   - Real multipart file upload (`POST /api/v1/fmd-sd/:id/upload`), streaming file download, and physical disk deletion.

---

## 🚀 Setup & Execution Guide

### 1. Prerequisites
- **Node.js**: v18+ (verified on v24.11.1)
- **MongoDB**: Local MongoDB instance listening on port 27017 OR MongoDB Atlas connection string

### 2. Environment Configuration
Create or configure `server/.env` based on `server/.env.example`:

```env
PORT=5000
NODE_ENV=development
# For Local MongoDB:
MONGODB_URI=mongodb://127.0.0.1:27017/tenderflow_erp
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/tenderflow_erp?retryWrites=true&w=majority

JWT_SECRET=tenderflow_erp_jwt_secret_dev_key_replace_in_production_32chars!
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:3000,http://localhost:5173

# Initial Administrator Seed Credentials
INITIAL_ADMIN_EMAIL=admin@tenderflow.gov.in
INITIAL_ADMIN_PASSWORD=AdminSecurePass@2024
INITIAL_ADMIN_NAME=Er. Rajesh Sharma
INITIAL_ADMIN_ROLE=Admin
```

### 3. Installation
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 4. Development & Execution Commands

#### Start Backend Server:
```bash
npm run server
# Or directly inside /server:
cd server && npm start
```
- API Root: `http://localhost:5000/api/v1`
- Health Check: `http://localhost:5000/api/health`

#### Start Frontend Application (PWA-enabled Development):
```bash
npm run dev
```
- Frontend UI: `http://localhost:3000/`
- Service Worker registration & live PWA development reload active.

#### Compile Production PWA Bundle:
```bash
npm run build
```
- Generates optimized client bundle in `dist/`.
- Compiles `dist/manifest.webmanifest`.
- Compiles Workbox precache service worker `dist/sw.js`.

#### Preview Production PWA Build:
```bash
npm run preview
```
- Local preview on `http://localhost:4173/` simulating production offline capabilities.

#### Pre-Flight DevOps & PWA Audit:
```bash
npm run audit
```
- Validates Vercel SPA config, Render blueprint, environment templates, `.gitignore` secret shielding, frontend PWA build output, and Dexie.js 6-module schema parity.

#### Run Backend Test Suite:
```bash
npm run server:test
```
Executes all 28 integration, workflow, document generation, and upload tests against an isolated test database.

#### Run Database Seed Script:
```bash
npm run server:seed
```
Seeds initial administrator credentials and default government records if the database is empty.

---

## 📡 REST API Route Catalog

### System & Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Operational health check with database diagnostics |

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Administrator login (rate-limited, returns token & sets HttpOnly cookie) |
| `POST` | `/api/v1/auth/setup-initial-admin` | One-time initial administrator setup (restricted once user exists) |
| `GET` | `/api/v1/auth/me` | Current authenticated session profile |
| `POST` | `/api/v1/auth/logout` | Clears authentication session cookie |

### Financial Years (`/api/v1/financial-years`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/financial-years` | List financial years (supports `search`, `status`, `page`, `limit`) |
| `GET` | `/api/v1/financial-years/:id` | Get single financial year by ID |
| `POST` | `/api/v1/financial-years` | Create new financial year (validates start/end date range) |
| `PATCH` | `/api/v1/financial-years/:id` | Update financial year |
| `DELETE` | `/api/v1/financial-years/:id` | Delete financial year (blocked if active or has associated work orders) |
| `PATCH` | `/api/v1/financial-years/:id/set-active` | Set global operating financial year |

### Work Orders (`/api/v1/work-orders`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/work-orders` | List work orders (supports `search`, `status`, `financialYear`, `subdivision`, `page`, `limit`) |
| `GET` | `/api/v1/work-orders/:id` | Get work order details including related agreements, billing vouchers & FMD records |
| `POST` | `/api/v1/work-orders` | Create work order (validates mandatory `(M)` fields, numeric amounts) |
| `PATCH` | `/api/v1/work-orders/:id` | Update work order |
| `DELETE` | `/api/v1/work-orders/:id` | Delete work order (blocked if associated billing records or agreements exist) |

### Agreements (`/api/v1/agreements`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/agreements` | List agreements (supports `search`, `templateType`, `status`, `page`, `limit`) |
| `GET` | `/api/v1/agreements/:id` | Get agreement details |
| `GET` | `/api/v1/agreements/:id/docx` | Generate official Microsoft Word (`.doc`) agreement contract |
| `POST` | `/api/v1/agreements` | Bind agreement to sanctioned work order |
| `PATCH` | `/api/v1/agreements/:id` | Update agreement clauses & details |
| `DELETE` | `/api/v1/agreements/:id` | Delete agreement |

### Billing (`/api/v1/billing`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/billing` | List bill vouchers (includes aggregate summary: gross, deductions, net) |
| `GET` | `/api/v1/billing/:id` | Get bill details with statutory deduction breakdown |
| `POST` | `/api/v1/billing` | Record running account / final bill with configurable GST & deductions |
| `PATCH` | `/api/v1/billing/:id` | Update bill voucher (recalculates totals) |
| `DELETE` | `/api/v1/billing/:id` | Delete bill record |

### Subdivisions (`/api/v1/subdivisions`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/subdivisions` | List subdivisions with associated work order and billing counts |
| `GET` | `/api/v1/subdivisions/:id` | Get subdivision details and linked record IDs |
| `POST` | `/api/v1/subdivisions` | Create administrative subdivision unit |
| `PATCH` | `/api/v1/subdivisions/:id` | Update subdivision |
| `DELETE` | `/api/v1/subdivisions/:id` | Delete subdivision (blocked if work orders are linked) |

### FMD / SD (`/api/v1/fmd-sd`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/fmd-sd` | List tender security and custody records |
| `GET` | `/api/v1/fmd-sd/:id` | Get FMD / SD record |
| `GET` | `/api/v1/fmd-sd/:id/docx` | Generate bilingual Word (`.doc`) custody certificate (`?lang=hi` or `?lang=en`) |
| `POST` | `/api/v1/fmd-sd/:id/upload` | Upload real multipart document (PDF, DOC, DOCX, images up to 15MB) |
| `GET` | `/api/v1/fmd-sd/:id/documents/:docId/download` | Stream uploaded document for download |
| `GET` | `/api/v1/fmd-sd/:id/documents/:docId/view` | Stream uploaded document for inline browser viewing |
| `POST` | `/api/v1/fmd-sd` | Register FMD / SD instrument |
| `PATCH` | `/api/v1/fmd-sd/:id` | Update FMD status / validity |
| `DELETE` | `/api/v1/fmd-sd/:id` | Delete FMD record and clean up associated physical files |
| `DELETE` | `/api/v1/fmd-sd/:id/documents/:docId` | Remove document metadata and delete file from disk |

---

## 📋 Business Assumptions & Rule Confirmations
1. **Meaning of TD**: Preserved as literal string `TD` in database models and UI forms without inventing an unconfirmed acronym.
2. **Mandatory Marker `(M)`**: Preserved for Tender Number and Work Order Number.
3. **GST Calculation**: Kept configurable (defaulting to 18%: 9% CGST + 9% SGST) with transparent base amount display.
4. **FMD Scope**: Preserved strictly as `FMD` without fabricating an unconfirmed definition.
5. **Storage**: Real disk custody storage with MIME filtering and size constraints implemented via `multer`. Cloud storage adapter pattern ready for production deployment.

