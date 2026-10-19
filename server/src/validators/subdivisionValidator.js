import { z } from 'zod';

export const subdivisionCreateSchema = z.object({
  name: z.string().min(1, 'Subdivision name is required'),
  code: z.string().optional().default(''),
  inCharge: z.string().optional().default(''),
  location: z.string().optional().default(''),
  status: z.enum(['Active', 'Inactive']).optional().default('Active'),
});

export const subdivisionUpdateSchema = subdivisionCreateSchema.partial();
