import { z } from 'zod';

export const workOrderCreateSchema = z.object({
  tenderNumber: z.string().min(1, 'Tender Number is mandatory'),
  workOrderNumber: z.string().min(1, 'Work Order Number is mandatory'),
  workOrderDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid Work Order Date is required',
  }),
  td: z.string().optional().default(''), // Preserved TD label
  emdNumber: z.string().optional().default(''),
  estimateNumber: z.string().optional().default(''),
  workOrderAmount: z.coerce.number().min(0, 'Work Order Amount must be non-negative'),
  status: z.enum(['Draft', 'Issued', 'In Progress', 'Completed', 'Terminated']).optional().default('Issued'),
  emdAmount: z.coerce.number().min(0, 'EMD Amount must be non-negative').optional().default(0),
  sdAmount: z.coerce.number().min(0, 'SD Amount must be non-negative').optional().default(0),
  financialYear: z.string().min(1, 'Financial Year association is required'),
  subdivision: z.string().nullable().optional(),
  subdivisionName: z.string().optional().default(''),
  title: z.string().optional().default(''),
  contractorName: z.string().optional().default(''),
  stipulatedDateOfCompletion: z.string().nullable().optional(),
});

export const workOrderUpdateSchema = workOrderCreateSchema.partial();
