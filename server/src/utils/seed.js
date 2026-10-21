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
        description: 'Current Operating Financial Year',
      },
      {
        label: '2025-2026',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2026-03-31'),
        status: 'Upcoming',
        isCurrent: false,
        description: 'Advance Estimates & Upcoming Projects',
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

  // 3. Seed Clean Project Divisions if empty
  const subCount = await Subdivision.countDocuments();
  if (subCount === 0) {
    console.log('[Seed] Initializing clean Project Divisions...');
    await Subdivision.create([
      {
        code: 'DIV-01',
        name: 'Project Division I (Civil & Infrastructure)',
        inCharge: 'Division Manager',
        location: 'Main Operations Center',
        status: 'Active',
      },
      {
        code: 'DIV-02',
        name: 'Project Division II (Electrical & MEP)',
        inCharge: 'Technical Lead',
        location: 'Site Operations',
        status: 'Active',
      },
    ]);
  }

  console.log('[Seed] Database initialization check complete (Production Clean - 0 Demo Records).');
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
