import { z } from 'zod';
import { CropType, TokenStatus } from '../types';

export const VALID_CROPS: [CropType, ...CropType[]] = [
  'Wheat (गेहूं)',
  'Paddy (धान / चावल)',
  'Soybean (सोयाबीन)',
  'Mustard (सरसों)',
  'Gram (चना)',
  'Maize (मक्का)',
  'Cotton (कपास)'
];

export const VALID_TOKEN_STATUSES: [TokenStatus, ...TokenStatus[]] = [
  'Registered',
  'In Queue',
  'Quality Check',
  'Procured',
  'Payment Sent',
  'Rejected',
  'Cancelled'
];

export const FarmerProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name too long').trim(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  village: z.string().min(2, 'Village is required').max(60).trim(),
  district: z.string().max(60).optional().default('Indore'),
  aadhaar_last4: z.string().regex(/^\d{4}$/, 'Last 4 digits of Aadhaar required').optional(),
  bank_account_last4: z.string().regex(/^\d{4}$/, 'Last 4 digits of Bank Account required').optional(),
  is_aadhaar_verified: z.boolean().optional()
});

export const CreateTokenSchema = z.object({
  farmer_id: z.string().min(1),
  farmer_name: z.string().min(2).max(60),
  farmer_phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
  farmer_village: z.string().min(1),
  center_id: z.string().min(1),
  center_name: z.string().optional(),
  crop: z.enum(VALID_CROPS),
  quantity: z.number().positive('Quantity must be greater than 0').max(500, 'Maximum lot size is 500 Quintals'),
  msp_rate: z.number().positive('MSP rate must be positive'),
  preferred_slot: z.string().min(1)
});

export const QualityCheckResultSchema = z.object({
  grade: z.enum(['Grade A (FAQ)', 'Grade B', 'Grade C', 'Rejected']),
  moisture: z.number().min(0).max(35),
  impurities: z.number().min(0).max(25),
  offered_rate: z.number().min(0).max(50000).optional(),
  notes: z.string().max(300).optional(),
  inspector_name: z.string().min(1).max(60),
  inspected_at: z.string().min(1)
});

export const AdvanceStatusSchema = z.object({
  status: z.enum(VALID_TOKEN_STATUSES),
  quality_check_result: QualityCheckResultSchema.optional(),
  note: z.string().max(200).optional()
});
