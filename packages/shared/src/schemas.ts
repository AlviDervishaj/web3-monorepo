import { z } from 'zod';
import { parseEther } from 'viem';

// Input schemas for forms (strings/numbers)
export const createCampaignInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  goal: z.string().regex(/^\d+(\.\d+)?$/, 'Goal must be a positive number'),
  durationInDays: z.number().int().min(1, 'Duration must be at least 1 day').max(365, 'Duration must be less than 365 days'),
});

// Output schema with transforms (for validation before submission)
export const createCampaignSchema = createCampaignInputSchema.transform((data) => ({
  ...data,
  goal: (() => {
    try {
      return parseEther(data.goal);
    } catch {
      throw new Error('Invalid goal amount');
    }
  })(),
}));

// Input schema for forms (strings)
export const addTierInputSchema = z.object({
  name: z.string().min(1, 'Tier name is required').max(50, 'Tier name must be less than 50 characters'),
  amount: z.string().regex(/^\d+$/, 'Amount must be a positive number'),
});

// Output schema with transform
export const addTierSchema = addTierInputSchema.transform((data) => ({
  ...data,
  amount: BigInt(data.amount),
}));

export const fundSchema = z.object({
  tierIndex: z.number().int().min(0, 'Invalid tier index'),
});

// Types for form inputs (what react-hook-form uses)
export type CreateCampaignInput = z.infer<typeof createCampaignInputSchema>;
export type AddTierInput = z.infer<typeof addTierInputSchema>;
export type FundInput = z.infer<typeof fundSchema>;

// Types for validated outputs (after transform)
export type CreateCampaignOutput = z.infer<typeof createCampaignSchema>;
export type AddTierOutput = z.infer<typeof addTierSchema>;

