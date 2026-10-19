import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { config } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { FinancialYear } from '../src/models/FinancialYear.js';
import { WorkOrder } from '../src/models/WorkOrder.js';
import { Agreement } from '../src/models/Agreement.js';
import { Billing } from '../src/models/Billing.js';
import { Subdivision } from '../src/models/Subdivision.js';
import { FmdSd } from '../src/models/FmdSd.js';

describe('TenderFlow ERP Backend API Test Suite', () => {
  let app;
  let authToken = '';

  before(async () => {
    // Connect to test database or local test instance
    const testUri = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/tenderflow_erp_test';
    await mongoose.connect(testUri);
    app = createApp();

    // Clean test database collections
    await Promise.all([
      User.deleteMany({}),
      FinancialYear.deleteMany({}),
      WorkOrder.deleteMany({}),
      Agreement.deleteMany({}),
      Billing.deleteMany({}),
      Subdivision.deleteMany({}),
      FmdSd.deleteMany({}),
    ]);
  });

  after(async () => {
    // Cleanup and close connection
    await Promise.all([
      User.deleteMany({}),
      FinancialYear.deleteMany({}),
      WorkOrder.deleteMany({}),
      Agreement.deleteMany({}),
      Billing.deleteMany({}),
      Subdivision.deleteMany({}),
      FmdSd.deleteMany({}),
    ]);
    await mongoose.disconnect();
  });

  // 1. Health Endpoint Tests
  describe('GET /api/health', () => {
    it('should return operational health status and database metrics', async () => {
      const res = await request(app).get('/api/health');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.status, 'healthy');
      assert.strictEqual(res.body.service, 'TenderFlow ERP API');
      assert.ok(res.body.database);
      assert.strictEqual(res.body.database.status, 'healthy');
    });
  });

  // 2. Authentication & Admin Setup Tests
  describe('Authentication (/api/v1/auth)', () => {
    it('should set up the initial administrator safely', async () => {
      const res = await request(app)
        .post('/api/v1/auth/setup-initial-admin')
        .send({
          name: 'Super Admin',
          email: 'admin.test@tenderflow.gov.in',
          password: 'Password12345!',
          role: 'Admin',
        });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.user.email, 'admin.test@tenderflow.gov.in');
      assert.ok(res.body.data.token);
      authToken = res.body.data.token;
    });

    it('should prevent second public admin registration once an admin exists', async () => {
      const res = await request(app)
        .post('/api/v1/auth/setup-initial-admin')
        .send({
          name: 'Hacker',
          email: 'hacker@test.com',
          password: 'Password12345!',
        });

      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, 'AdminAlreadyConfigured');
    });

    it('should login administrator with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin.test@tenderflow.gov.in',
          password: 'Password12345!',
        });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.ok(res.headers['set-cookie']); // HttpOnly cookie set
    });

    it('should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin.test@tenderflow.gov.in',
          password: 'WrongPassword!',
        });

      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
    });

    it('should retrieve current session profile with token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.data.user.email, 'admin.test@tenderflow.gov.in');
    });

    it('should reject unauthorized request without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
    });
  });

  // 3. Financial Year CRUD & Validation Tests
  describe('Financial Year Module (/api/v1/financial-years)', () => {
    let createdFyId = '';

    it('should reject invalid date range where end date is before start date', async () => {
      const res = await request(app)
        .post('/api/v1/financial-years')
        .send({
          label: '2024-2025',
          startDate: '2024-04-01',
          endDate: '2024-03-31', // Before start date
        });

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
    });

    it('should create a valid financial year', async () => {
      const res = await request(app)
        .post('/api/v1/financial-years')
        .send({
          label: '2024-2025',
          startDate: '2024-04-01',
          endDate: '2025-03-31',
          status: 'Active',
          isCurrent: true,
          description: 'Operating year',
        });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.data.label, '2024-2025');
      createdFyId = res.body.data._id;
    });

    it('should reject duplicate financial year label', async () => {
      const res = await request(app)
        .post('/api/v1/financial-years')
        .send({
          label: '2024-2025',
          startDate: '2025-04-01',
          endDate: '2026-03-31',
        });

      assert.strictEqual(res.statusCode, 409); // Duplicate Key Error
      assert.strictEqual(res.body.success, false);
    });

    it('should list financial years with pagination', async () => {
      const res = await request(app).get('/api/v1/financial-years?page=1&limit=10');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(Array.isArray(res.body.data));
      assert.strictEqual(res.body.data.length, 1);
    });

    it('should update financial year details', async () => {
      const res = await request(app)
        .patch(`/api/v1/financial-years/${createdFyId}`)
        .send({ description: 'Updated operating notes' });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.data.description, 'Updated operating notes');
    });

    it('should handle invalid MongoDB ID gracefully', async () => {
      const res = await request(app).get('/api/v1/financial-years/invalid-object-id-123');
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.error, 'InvalidId');
    });
  });

  // 4. Subdivision CRUD Tests
  describe('Subdivision Module (/api/v1/subdivisions)', () => {
    let createdSubId = '';

    it('should create a valid subdivision with code and name', async () => {
      const res = await request(app)
        .post('/api/v1/subdivisions')
        .send({
          name: 'Subdivision I (Civil)',
          code: 'SD-01',
          inCharge: 'Er. Suresh',
          location: 'HQ Campus',
        });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.data.name, 'Subdivision I (Civil)');
      createdSubId = res.body.data._id;
    });

    it('should list subdivisions including associated count metadata', async () => {
      const res = await request(app).get('/api/v1/subdivisions');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(Array.isArray(res.body.data));
      assert.strictEqual(res.body.data[0].workOrderCount, 0);
    });
  });

  // 5. Work Order CRUD & Preserved Labels Tests
  describe('Work Order Module (/api/v1/work-orders)', () => {
    let createdWoId = '';

    it('should reject work order missing mandatory fields Tender Number (M) or Work Order Number (M)', async () => {
      const res = await request(app)
        .post('/api/v1/work-orders')
        .send({
          workOrderDate: '2024-05-15',
          workOrderAmount: 100000,
          financialYear: '2024-2025',
        });

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
    });

    it('should create work order preserving TD and mandatory (M) fields', async () => {
      const res = await request(app)
        .post('/api/v1/work-orders')
        .send({
          tenderNumber: 'TN-TEST-001',
          workOrderNumber: 'WO-TEST-001',
          workOrderDate: '2024-05-15',
          td: 'TD-SPECIAL-01',
          emdNumber: 'EMD-12345',
          estimateNumber: 'EST-99',
          workOrderAmount: 2500000,
          status: 'Issued',
          emdAmount: 50000,
          sdAmount: 125000,
          financialYear: '2024-2025',
          title: 'Construction of Canal Sluice Gate',
          contractorName: 'M/s National Builders',
        });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.data.workOrderNumber, 'WO-TEST-001');
      assert.strictEqual(res.body.data.td, 'TD-SPECIAL-01');
      assert.strictEqual(res.body.data.workOrderAmount, 2500000);
      createdWoId = res.body.data._id;
    });

    it('should reject duplicate Work Order Number', async () => {
      const res = await request(app)
        .post('/api/v1/work-orders')
        .send({
          tenderNumber: 'TN-TEST-002',
          workOrderNumber: 'WO-TEST-001', // Duplicate
          workOrderDate: '2024-05-15',
          workOrderAmount: 500000,
          financialYear: '2024-2025',
        });

      assert.strictEqual(res.statusCode, 409);
    });

    it('should filter work orders by status and financial year', async () => {
      const res = await request(app).get(
        '/api/v1/work-orders?status=Issued&financialYear=2024-2025'
      );
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.data.length, 1);
    });
  });

  // 6. Agreement CRUD & Document Generation Tests
  describe('Agreement Module (/api/v1/agreements)', () => {
    let createdAgrId = '';

    it('should create agreement bound to existing work order', async () => {
      const wo = await WorkOrder.findOne();
      const res = await request(app)
        .post('/api/v1/agreements')
        .send({
          workOrder: wo._id.toString(),
          workOrderNumber: wo.workOrderNumber,
          agreementNumber: 'AGR/TEST/001',
          templateType: 'Standard PWD Contract Form F-2 (Lump Sum)',
          agreementDate: '2024-05-20',
          stampDutyNumber: 'E-STAMP-01',
          stampDutyAmount: 5000,
          status: 'Active',
          content: 'Contract terms and specifications.',
          language: 'en',
        });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.data.agreementNumber, 'AGR/TEST/001');
      createdAgrId = res.body.data._id;
    });

    it('should generate official Word (.doc) document for agreement', async () => {
      const res = await request(app)
        .get(`/api/v1/agreements/${createdAgrId}/docx`);

      assert.strictEqual(res.statusCode, 200);
      assert.match(res.headers['content-type'], /application\/msword/);
      assert.match(res.headers['content-disposition'], /attachment; filename=/);
      assert.match(res.text, /LEGAL ARTICLES OF CONTRACT AGREEMENT/);
    });
  });

  // 7. Billing Module Tests (Configurable GST and Statutory Deductions)
  describe('Billing Module (/api/v1/billing)', () => {
    it('should compute configurable GST and statutory deductions properly', async () => {
      const wo = await WorkOrder.findOne();
      const res = await request(app)
        .post('/api/v1/billing')
        .send({
          workOrder: wo._id.toString(),
          workOrderNumber: wo.workOrderNumber,
          invoiceNumber: 'RA-01/TEST',
          invoiceDate: '2024-06-15',
          completionDate: '2024-06-10',
          handoverDate: '2024-06-12',
          amount: 100000, // Basic
          gstRate: 18, // 18% GST -> 18,000 -> Total 118,000
          totalAmount: 118000,
          deductions: {
            sdAmount: 5000, // 5%
            tdsAmount: 2000, // 2%
            labourCess: 1000, // 1%
            royalty: 500,
            penalty: 0,
          }, // Total deductions = 8,500 -> Net = 109,500
          status: 'Submitted',
        });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.data.totalAmount, 118000);
      assert.strictEqual(res.body.data.totalDeductions, 8500);
      assert.strictEqual(res.body.data.netPayable, 109500);
    });
  });

  // 8. Work Order Related Records Verification
  describe('Work Order Related Records Detail Workflow', () => {
    it('should return work order with populated related agreements and billing records', async () => {
      const wo = await WorkOrder.findOne();
      const res = await request(app).get(`/api/v1/work-orders/${wo._id}`);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.data.related);
      assert.ok(Array.isArray(res.body.data.related.agreements));
      assert.ok(Array.isArray(res.body.data.related.billingRecords));
      assert.ok(res.body.data.related.summary);
      assert.strictEqual(res.body.data.related.summary.agreementsCount, 1);
      assert.strictEqual(res.body.data.related.summary.billingRecordsCount, 1);
      assert.strictEqual(res.body.data.related.summary.totalBilled, 118000);
    });
  });

  // 9. FMD / SD Module Tests (Preserved FMD terminology, multipart upload, Word certificates)
  describe('FMD / SD Module (/api/v1/fmd-sd)', () => {
    let createdFmdId = '';
    let uploadedDocId = '';

    it('should register FMD / SD tender security record', async () => {
      const wo = await WorkOrder.findOne();
      const res = await request(app)
        .post('/api/v1/fmd-sd')
        .send({
          tenderNumber: 'TN-FMD-999',
          tenderTitle: 'Construction of Sub-Station',
          workOrder: wo._id.toString(),
          workOrderNumber: wo.workOrderNumber,
          fmdStatus: 'Verified & Retained',
          sdAmount: 150000,
          emdAmount: 30000,
          instrumentType: 'Bank Guarantee (FDR / BG)',
          bankName: 'State Bank of India',
          instrumentReference: 'BG-SBI-001',
          validityDate: '2026-03-31',
          language: 'en',
        });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.data.tenderNumber, 'TN-FMD-999');
      assert.strictEqual(res.body.data.fmdStatus, 'Verified & Retained');
      createdFmdId = res.body.data._id;
    });

    it('should generate official bilingual Word (.doc) custody certificates in Hindi and English', async () => {
      // English certificate
      const resEn = await request(app).get(`/api/v1/fmd-sd/${createdFmdId}/docx?lang=en`);
      assert.strictEqual(resEn.statusCode, 200);
      assert.match(resEn.headers['content-type'], /application\/msword/);
      assert.match(resEn.text, /SECURITY DEPOSIT/);

      // Hindi certificate with Unicode support
      const resHi = await request(app).get(`/api/v1/fmd-sd/${createdFmdId}/docx?lang=hi`);
      assert.strictEqual(resHi.statusCode, 200);
      assert.match(resHi.headers['content-type'], /application\/msword/);
      assert.match(resHi.text, /सुरक्षा जमा/);
    });

    it('should upload real multipart file with MIME validation to server custody', async () => {
      const fakePdfContent = Buffer.from('%PDF-1.4 test security deposit receipt content');

      const res = await request(app)
        .post(`/api/v1/fmd-sd/${createdFmdId}/upload`)
        .attach('file', fakePdfContent, 'SBI_Bank_Guarantee_15Lakhs.pdf');

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.uploadedDocuments.length, 1);

      const uploadedDoc = res.body.data.uploadedDocuments[0];
      assert.strictEqual(uploadedDoc.name, 'SBI_Bank_Guarantee_15Lakhs.pdf');
      assert.ok(uploadedDoc.path);
      uploadedDocId = uploadedDoc._id;
    });

    it('should stream uploaded file download with proper headers', async () => {
      const res = await request(app)
        .get(`/api/v1/fmd-sd/${createdFmdId}/documents/${uploadedDocId}/download`);

      assert.strictEqual(res.statusCode, 200);
      assert.match(res.headers['content-disposition'], /attachment/);
    });

    it('should safely delete uploaded file from database and disk storage', async () => {
      const res = await request(app)
        .delete(`/api/v1/fmd-sd/${createdFmdId}/documents/${uploadedDocId}`);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.data.uploadedDocuments.length, 0);
    });
  });
});
