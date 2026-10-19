import { z } from 'zod';

export const fmdSdCreateSchema = z.object({
  tenderNumber: z.string().min(1, 'Tender Number is required'),
  tenderTitle: z.string().min(1, 'Tender Title is required'),
  workOrder: z.string().nullable().optional(),
  workOrderNumber: z.string().optional().default(''),
  contractorName: z.string().optional().default(''),
  fmdStatus: z
    .enum([
      'Verified & Retained',
      'Under Scrutiny',
      'Pending Bank Confirmation',
      'Released',
      'Forfeited',
    ])
    .optional()
    .default('Verified & Retained'),
  sdAmount: z.coerce.number().min(0, 'SD Amount cannot be negative').optional().default(0),
  emdAmount: z.coerce.number().min(0, 'EMD Amount cannot be negative').optional().default(0),
  instrumentType: z.string().optional().default('Bank Guarantee (FDR / BG)'),
  bankName: z.string().optional().default(''),
  instrumentReference: z.string().optional().default(''),
  validityDate: z.string().nullable().optional(),
  language: z.enum(['en', 'hi']).optional().default('en'),
  uploadedDocuments: z
    .array(
      z.object({
        name: z.string(),
        size: z.string().optional(),
        type: z.string().optional(),
        uploadedAt: z.string().optional(),
        storageUrl: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export const fmdSdUpdateSchema = fmdSdCreateSchema.partial();
