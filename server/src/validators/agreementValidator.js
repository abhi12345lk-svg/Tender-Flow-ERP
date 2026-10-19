import { z } from 'zod';

export const agreementCreateSchema = z.object({
  workOrder: z.string().min(1, 'Related Work Order ID is required'),
  workOrderNumber: z.string().min(1, 'Work Order Number is required'),
  tenderNumber: z.string().optional().default(''),
  contractorName: z.string().optional().default(''),
  agreementNumber: z.string().min(1, 'Agreement Number is required'),
  templateType: z.string().min(1, 'Contract template form is required'),
  agreementDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid Agreement Date is required',
  }),
  stampDutyNumber: z.string().optional().default(''),
  stampDutyAmount: z.coerce.number().min(0, 'Stamp duty cannot be negative').optional().default(0),
  status: z.enum(['Active', 'Draft', 'Executed', 'Closed']).optional().default('Active'),
  clausesCount: z.coerce.number().min(1).optional().default(36),
  documentTitle: z.string().optional().default(''),
  content: z.string().optional().default(''),
  language: z.enum(['en', 'hi']).optional().default('en'),
  fileMetadata: z.array(z.object({
    fileName: z.string(),
    fileSize: z.string().optional(),
    mimeType: z.string().optional(),
    storageUrl: z.string().optional(),
  })).optional().default([]),
});

export const agreementUpdateSchema = agreementCreateSchema.partial();
