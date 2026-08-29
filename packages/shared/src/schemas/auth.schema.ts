import { z } from 'zod';
import { ROLES } from '../constants/status.constants.js';

// ─── Login ───────────────────────────────────────────────────────────────────
export const loginSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .strict();

// ─── Register ────────────────────────────────────────────────────────────────
export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and a number',
      ),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    role: z.enum(ROLES),
  })
  .strict();
