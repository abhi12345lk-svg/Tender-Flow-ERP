import { z } from 'zod';

export const billingCreateSchema = z.object({
  workOrder: z.string().min(1, 'Related Work Order is required'),
  workOrderNumber: z.string().min(1, 'Work Order Number is required'),
  tenderNumber: z.string().optional().default(''),
  contractorName: z.string().optional().default(''),
  invoiceNumber: z.string().min(1, 'Invoice Number is required'),
  invoiceDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid Invoice Date is required',
  }),
  completionDate: z.string().nullable().optional(),
  handoverDate: z.string().nullable().optional(),
  amount: z.coerce.number().min(0, 'Basic bill amount must be non-negative'),
  gstRate: z.coerce.number().min(0).optional().default(18), // Configurable GST rate
  gstAmount: z.coerce.number().min(0).optional(),
  totalAmount: z.coerce.number().min(0, 'Total amount must be non-negative'),
  status: z.enum(['Draft', 'Submitted', 'Under Review', 'Passed']).optional().default('Submitted'),
  deductions: z.object({
    sdAmount: z.coerce.number().min(0).optional().default(0),
    tdsAmount: z.coerce.number().min(0).optional().default(0),
    labourCess: z.coerce.number().min(0).optional().default(0),
    royalty: z.coerce.number().min(0).optional().default(0),
    penalty: z.coerce.number().min(0).optional().default(0),
  }).optional().default({}),
  totalDeductions: z.coerce.number().min(0).optional().default(0),
  netPayable: z.coerce.number().min(0).optional().default(0),
  subdivision: z.string().nullable().optional(),
  subdivisionName: z.string().optional().default(''),
  financialYear: z.string().optional().default(''),
  remarks: z.string().optional().default(''),
});

export const billingUpdateSchema = billingCreateSchema.partial();
