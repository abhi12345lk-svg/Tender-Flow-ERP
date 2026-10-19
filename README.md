# TenderFlow ERP — Government Works Management System

A production-quality Government Works Management ERP built for Public Works Divisions, Municipal Corporations, and Infrastructure Authorities to streamline Work Orders, Agreements, Contractor Billing, Subdivisions, and Tender Security (FMD / SD) custody.

---

## 🏗️ Architecture & Technology Stack

### Frontend (Step 1):
- **Framework**: React 18 with Vite
- **Language**: JavaScript (ESModules) — *no TypeScript*
- **Styling**: Tailwind CSS with custom government design tokens (Dark Navy `#070d1e`, Gov Blue `#1d4ed8`, Slate `#f8fafc`)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **API Client**: Centralized REST client with automatic authentication token and cookie propagation

### Backend (Step 2):
- **Runtime & Framework**: Node.js & Express.js (ESModules)
- **Database**: MongoDB Atlas / Local MongoDB with Mongoose ODM
- **Validation**: Zod schema validation middleware
- **Security**: Helmet, CORS with explicit whitelist, Express-Rate-Limit, bcrypt password hashing
- **Authentication**: JWT authentication with HttpOnly cookies & Bearer token support
- **Testing**: Automated test suite with 23 passing tests covering all models and endpoints

---

## 🏢 Business Modules (Exactly 6 Core Modules)

1. **Financial Year (`/api/v1/financial-years`)**
   - Fiscal cycle configuration with start/end date range boundary validation.
   - Non-overlapping date range protection.
   - Global active Financial Year context switcher in Topbar and API.

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

3. **Agreement (`/api/v1/agreements`)**
   - Bind sanctioned Work Orders to legal contract templates:
     - Standard PWD Form F-2 (Lump Sum)
     - Item Rate Agreement Form B-1
     - EPC Turnkey Contract Template
   - E-Stamp Duty certificate tracking.
   - Contract clauses entry point.
   - Official government printable agreement modal with browser Print-to-PDF engine.
   - Client-side Word (.doc) draft export (clearly identified for Step 3 dynamic generator).

4. **Billing (`/api/v1/billing`)**
   - Running Account (RA) & Final Bill vouchers:
     - `Date of Completion` & `Date of Handover`
     - `Invoice Number` (unique) & `Invoice Date`
     - `Basic Amount` (Excl. GST)
     - `Configurable GST Rate` (default 18%: CGST 9% + SGST 9%) & auto-calculated Gross Total
     - `Statutory Deduction Form`: Security Deposit (5%), IT-TDS (2%), Labour Cess (1%), Royalty, Penalties
     - `Net Payable Disbursable Calculation` (Gross Total minus Statutory Deductions)
     - Related Work Order & Subdivision association.

5. **Subdivision (`/api/v1/subdivisions`)**
   - Administrative sub-unit management:
     - Subdivision Name, Code, In-Charge Officer, Campus
     - Linked Work Orders and Billing vouchers inspection.
     - Integrity checks preventing deletion of active operational subdivisions.

6. **FMD / SD (`/api/v1/fmd-sd`)**
   - Preserved strictly as **FMD / SD** without inventing fictitious names.
   - Financial security instrument custody: Bank Guarantee (BG), Fixed Deposit Receipt (FDR), Treasury Challan.
   - **Bilingual Document / Print Format Entry Point**: Real-time **English / हिंदी (Hindi)** toggle.
   - Document upload dropzone storing safe file metadata (no unbounded base64 strings in MongoDB).

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

### 4. Running the Application

#### Start Backend Server:
```bash
npm run server
# Or directly inside /server:
cd server && npm start
```
- API Root: `http://localhost:5000/api/v1`
- Health Check: `http://localhost:5000/api/health`

#### Start Frontend Application:
```bash
npm run dev
```
- Frontend UI: `http://localhost:3000/`

#### Run Backend Test Suite:
```bash
npm run server:test
```
Executes all 23 integration and model tests against an isolated test database.

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
| `GET` | `/api/v1/work-orders/:id` | Get work order details |
| `POST` | `/api/v1/work-orders` | Create work order (validates mandatory `(M)` fields, numeric amounts) |
| `PATCH` | `/api/v1/work-orders/:id` | Update work order |
| `DELETE` | `/api/v1/work-orders/:id` | Delete work order (blocked if associated billing records or agreements exist) |

### Agreements (`/api/v1/agreements`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/agreements` | List agreements (supports `search`, `templateType`, `status`, `page`, `limit`) |
| `GET` | `/api/v1/agreements/:id` | Get agreement details |
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
| `POST` | `/api/v1/fmd-sd` | Register FMD / SD instrument |
| `PATCH` | `/api/v1/fmd-sd/:id` | Update FMD status / validity |
| `DELETE` | `/api/v1/fmd-sd/:id` | Delete FMD record |
| `POST` | `/api/v1/fmd-sd/:id/documents` | Upload document metadata reference |
| `DELETE` | `/api/v1/fmd-sd/:id/documents/:docId` | Remove document metadata reference |

---

## 📋 Business Assumptions for Confirmation (Step 3 Preview)
1. **Meaning of TD**: Preserved as literal string `TD` in database models and UI forms without inventing an unconfirmed acronym.
2. **Mandatory Marker `(M)`**: Preserved for Tender Number and Work Order Number.
3. **GST Calculation**: Configurable tax rate (defaulting to 18%: 9% CGST + 9% SGST).
4. **FMD Scope**: Preserved strictly as `FMD` without fabricating an unconfirmed definition.
5. **Storage**: Step 2 records file metadata in MongoDB; binary file hosting (AWS S3 or secure local disk) will be integrated in Step 3.
