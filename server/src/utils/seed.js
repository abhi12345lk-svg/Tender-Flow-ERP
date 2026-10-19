import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { FinancialYear } from '../models/FinancialYear.js';
import { Subdivision } from '../models/Subdivision.js';
import { WorkOrder } from '../models/WorkOrder.js';
import { Agreement } from '../models/Agreement.js';
import { Billing } from '../models/Billing.js';
import { FmdSd } from '../models/FmdSd.js';

export const seedDatabase = async () => {
  console.log('[Seed] Checking database seeding requirements...');

  // 1. Seed Initial Admin if no user exists
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log(`[Seed] Creating initial administrator: ${config.initialAdmin.email}`);
    await User.create({
      name: config.initialAdmin.name,
      email: config.initialAdmin.email,
      password: config.initialAdmin.password,
      role: config.initialAdmin.role,
      department: 'Public Works Department (Div-1)',
    });
    console.log('[Seed] Initial administrator created.');
  }

  // 2. Seed Financial Years if empty
  const fyCount = await FinancialYear.countDocuments();
  if (fyCount === 0) {
    console.log('[Seed] Seeding default Financial Years...');
    await FinancialYear.create([
      {
        label: '2024-2025',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2025-03-31'),
        status: 'Active',
        isCurrent: true,
        description: 'Current Operating Financial Year (PWD Division 1)',
      },
      {
        label: '2025-2026',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2026-03-31'),
        status: 'Upcoming',
        isCurrent: false,
        description: 'Advance Estimates & Sanctioned Works',
      },
      {
        label: '2023-2024',
        startDate: new Date('2023-04-01'),
        endDate: new Date('2024-03-31'),
        status: 'Closed',
        isCurrent: false,
        description: 'Audited & Reconciled Financial Accounts',
      },
    ]);
  }

  // 3. Seed Subdivisions if empty
  const subCount = await Subdivision.countDocuments();
  let subdivisions = [];
  if (subCount === 0) {
    console.log('[Seed] Seeding Subdivisions...');
    subdivisions = await Subdivision.create([
      {
        code: 'SD-CIVIL-01',
        name: 'Subdivision I (Civil & Buildings)',
        inCharge: 'Er. Suresh Verma, A.E.',
        location: 'Central Division Complex',
        status: 'Active',
      },
      {
        code: 'SD-ROADS-02',
        name: 'Subdivision II (Roads & Bridges)',
        inCharge: 'Er. Alok Nath, A.E.',
        location: 'Sector 4 Highway Yard',
        status: 'Active',
      },
      {
        code: 'SD-ELEC-03',
        name: 'Subdivision III (Electrical & Utility)',
        inCharge: 'Er. Neha Gupta, A.E.',
        location: 'Power Substation Enclave',
        status: 'Active',
      },
      {
        code: 'SD-RURAL-04',
        name: 'Subdivision IV (Rural Works)',
        inCharge: 'Er. D.K. Mishra, A.E.',
        location: 'Tehsil Office Campus',
        status: 'Active',
      },
    ]);
  } else {
    subdivisions = await Subdivision.find();
  }

  // 4. Seed Work Orders if empty
  const woCount = await WorkOrder.countDocuments();
  let workOrders = [];
  if (woCount === 0) {
    console.log('[Seed] Seeding Work Orders...');
    const subRoads = subdivisions.find((s) => s.code === 'SD-ROADS-02') || subdivisions[0];
    const subCivil = subdivisions.find((s) => s.code === 'SD-CIVIL-01') || subdivisions[0];
    const subElec = subdivisions.find((s) => s.code === 'SD-ELEC-03') || subdivisions[0];

    workOrders = await WorkOrder.create([
      {
        tenderNumber: 'TN-PWD-2024-892',
        workOrderNumber: 'WO-2024-00142',
        workOrderDate: new Date('2024-05-15'),
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
        subdivision: subRoads?._id,
        subdivisionName: subRoads?.name || '',
        stipulatedDateOfCompletion: new Date('2025-06-30'),
      },
      {
        tenderNumber: 'TN-PWD-2024-914',
        workOrderNumber: 'WO-2024-00178',
        workOrderDate: new Date('2024-06-10'),
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
        subdivision: subRoads?._id,
        subdivisionName: subRoads?.name || '',
        stipulatedDateOfCompletion: new Date('2025-04-15'),
      },
      {
        tenderNumber: 'TN-PWD-2024-771',
        workOrderNumber: 'WO-2024-00085',
        workOrderDate: new Date('2024-04-20'),
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
        subdivision: subCivil?._id,
        subdivisionName: subCivil?.name || '',
        stipulatedDateOfCompletion: new Date('2024-11-30'),
      },
      {
        tenderNumber: 'TN-PWD-2024-945',
        workOrderNumber: 'WO-2024-00201',
        workOrderDate: new Date('2024-07-02'),
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
        subdivision: subElec?._id,
        subdivisionName: subElec?.name || '',
        stipulatedDateOfCompletion: new Date('2025-01-31'),
      },
    ]);
  } else {
    workOrders = await WorkOrder.find();
  }

  // 5. Seed Agreements if empty
  const agrCount = await Agreement.countDocuments();
  if (agrCount === 0 && workOrders.length > 0) {
    console.log('[Seed] Seeding Agreements...');
    await Agreement.create([
      {
        agreementNumber: 'AGR/PWD/2024/098',
        workOrder: workOrders[0]._id,
        workOrderNumber: workOrders[0].workOrderNumber,
        tenderNumber: workOrders[0].tenderNumber,
        contractorName: workOrders[0].contractorName,
        templateType: 'Standard PWD Contract Form F-2 (Lump Sum)',
        agreementDate: new Date('2024-05-20'),
        stampDutyNumber: 'E-STAMP-DL24-998812',
        stampDutyAmount: 15000,
        status: 'Active',
        clausesCount: 42,
        documentTitle: 'Contract Agreement for Ken Canal Bridge Construction',
        content: `MEMORANDUM OF AGREEMENT executed between PWD and M/s Infra Buildcon India Ltd.`,
        language: 'en',
      },
      {
        agreementNumber: 'AGR/PWD/2024/112',
        workOrder: workOrders[1]._id,
        workOrderNumber: workOrders[1].workOrderNumber,
        tenderNumber: workOrders[1].tenderNumber,
        contractorName: workOrders[1].contractorName,
        templateType: 'Item Rate Agreement Form B-1',
        agreementDate: new Date('2024-06-18'),
        stampDutyNumber: 'E-STAMP-DL24-664421',
        stampDutyAmount: 12000,
        status: 'Active',
        clausesCount: 38,
        documentTitle: 'Agreement for MDR-42 Widening & Strengthening',
        content: `THIS AGREEMENT executed for MDR-42 Highway Widening under MoRTH Section 500.`,
        language: 'en',
      },
    ]);
  }

  // 6. Seed Billing if empty
  const billCount = await Billing.countDocuments();
  if (billCount === 0 && workOrders.length > 0) {
    console.log('[Seed] Seeding Billing Records...');
    await Billing.create([
      {
        invoiceNumber: 'RA-01/PWD/2024-25',
        invoiceDate: new Date('2024-08-14'),
        workOrder: workOrders[0]._id,
        workOrderNumber: workOrders[0].workOrderNumber,
        tenderNumber: workOrders[0].tenderNumber,
        contractorName: workOrders[0].contractorName,
        subdivision: workOrders[0].subdivision,
        subdivisionName: workOrders[0].subdivisionName,
        completionDate: new Date('2024-08-10'),
        handoverDate: new Date('2024-08-12'),
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
        financialYear: '2024-2025',
        remarks: '1st Running Account (RA) Bill approved after Divisional Scrutiny',
      },
      {
        invoiceNumber: 'FINAL-BILL/2024-03',
        invoiceDate: new Date('2024-11-28'),
        workOrder: workOrders[2]._id,
        workOrderNumber: workOrders[2].workOrderNumber,
        tenderNumber: workOrders[2].tenderNumber,
        contractorName: workOrders[2].contractorName,
        subdivision: workOrders[2].subdivision,
        subdivisionName: workOrders[2].subdivisionName,
        completionDate: new Date('2024-11-20'),
        handoverDate: new Date('2024-11-25'),
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
        financialYear: '2024-2025',
        remarks: 'Final Completion Bill submitted with measurement book inspection notes',
      },
    ]);
  }

  // 7. Seed FMD / SD if empty
  const fmdCount = await FmdSd.countDocuments();
  if (fmdCount === 0 && workOrders.length > 0) {
    console.log('[Seed] Seeding FMD / SD Records...');
    await FmdSd.create([
      {
        tenderNumber: 'TN-PWD-2024-892',
        tenderTitle: 'Construction of High-Level RCC Bridge across Ken Canal Km 14/2',
        workOrder: workOrders[0]._id,
        workOrderNumber: workOrders[0].workOrderNumber,
        contractorName: 'M/s Infra Buildcon India Ltd.',
        fmdStatus: 'Verified & Retained',
        sdAmount: 2425000,
        emdAmount: 970000,
        instrumentType: 'Bank Guarantee (FDR / BG)',
        bankName: 'State Bank of India (Commercial Branch)',
        instrumentReference: 'BG-SBI-ND-2024-0994',
        validityDate: new Date('2026-06-30'),
        language: 'en',
        uploadedDocuments: [
          {
            name: 'SBI_Bank_Guarantee_24.25Lakhs.pdf',
            size: '1.4 MB',
            type: 'application/pdf',
            uploadedAt: '18 May 2024, 11:30 AM',
          },
          {
            name: 'Contractor_Security_Undertaking_Signed.pdf',
            size: '840 KB',
            type: 'application/pdf',
            uploadedAt: '19 May 2024, 02:15 PM',
          },
        ],
      },
      {
        tenderNumber: 'TN-PWD-2024-914',
        tenderTitle: 'Widening & Strengthening of Main District Road MDR-42 (Km 0 to 18)',
        workOrder: workOrders[1]._id,
        workOrderNumber: workOrders[1].workOrderNumber,
        contractorName: 'Apex Roadways Infrastructure Pvt Ltd',
        fmdStatus: 'Under Scrutiny',
        sdAmount: 1340000,
        emdAmount: 536000,
        instrumentType: 'Fixed Deposit Receipt (FDR)',
        bankName: 'HDFC Bank Ltd',
        instrumentReference: 'FDR-501004882199',
        validityDate: new Date('2025-10-31'),
        language: 'en',
        uploadedDocuments: [
          {
            name: 'HDFC_FDR_Pledge_Receipt.pdf',
            size: '620 KB',
            type: 'application/pdf',
            uploadedAt: '12 Jun 2024, 10:45 AM',
          },
        ],
      },
    ]);
  }

  console.log('[Seed] Database initialization check complete.');
};

// If run directly from CLI (npm run seed)
if (process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    try {
      await connectDatabase();
      await seedDatabase();
      console.log('Seeding completed successfully.');
      await disconnectDatabase();
      process.exit(0);
    } catch (err) {
      console.error('Seeding failed:', err);
      process.exit(1);
    }
  })();
}
