import { z } from 'zod';

export const createStoppageSchema = z
  .object({
    reason: z
      .string()
      .min(3, 'Reason must be at least 3 characters')
      .max(255, 'Reason must not exceed 255 characters'),
    startDate: z.coerce.date({
      required_error: 'Stoppage start date is required',
      invalid_type_error: 'Invalid start date format',
    }),
    endDate: z.coerce
      .date({
        invalid_type_error: 'Invalid end date format',
      })
      .optional()
      .nullable(),
    daysAdded: z.number().int().positive().optional(),
  })
  .refine(
    (data) => !data.endDate || data.endDate >= data.startDate,
    {
      message: 'End date must be equal to or after start date',
      path: ['endDate'],
    }
  );

export const updateStoppageSchema = z
  .object({
    reason: z
      .string()
      .min(3, 'Reason must be at least 3 characters')
      .max(255, 'Reason must not exceed 255 characters')
      .optional(),
    startDate: z.coerce
      .date({
        invalid_type_error: 'Invalid start date format',
      })
      .optional(),
    endDate: z.coerce
      .date({
        invalid_type_error: 'Invalid end date format',
      })
      .optional()
      .nullable(),
    daysAdded: z.number().int().positive().optional(),
  })
  .refine(
    (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
    {
      message: 'End date must be equal to or after start date',
      path: ['endDate'],
    }
  );

export type CreateStoppageInput = z.infer<typeof createStoppageSchema>;
export type UpdateStoppageInput = z.infer<typeof updateStoppageSchema>;

export interface ProjectStoppage {
  id: string;
  projectId: string;
  reason: string;
  daysAdded: number;
  startDate: string;
  endDate: string | null;
  isOngoing: boolean;
  createdAt: string;
}

export interface TimelineAlert {
  type: 'CRITICAL_OVERRUN' | 'SLOW_VELOCITY' | 'ON_TRACK';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
}

export interface TimelineAnalysis {
  originalContractDays: number;
  totalStoppageDays: number;
  adjustedTimelineDays: number;
  originalStartDate: string;
  originalEndDate: string;
  adjustedEndDate: string;
  actualDaysElapsed: number;
  timeElapsedPercentage: number;
  physicalProgressPercentage: number;
  overrunDays: number;
  isFrozen: boolean;
  alerts: TimelineAlert[];
  stoppages: ProjectStoppage[];
}
