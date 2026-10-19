import { z } from 'zod';

const financialYearBaseSchema = z.object({
  label: z
    .string()
    .regex(/^\d{4}-\d{4}$/, 'Format must be YYYY-YYYY (e.g. 2024-2025)'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start date format',
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid end date format',
  }),
  status: z.enum(['Active', 'Upcoming', 'Closed']).optional(),
  isCurrent: z.boolean().optional(),
  description: z.string().optional(),
});

export const financialYearCreateSchema = financialYearBaseSchema.refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'End date must be strictly after Start date',
    path: ['endDate'],
  }
);

export const financialYearUpdateSchema = financialYearBaseSchema.partial().refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'End date must be strictly after Start date',
    path: ['endDate'],
  }
);
