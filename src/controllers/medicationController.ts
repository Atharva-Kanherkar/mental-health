/**
 * Medication Controller
 * Handles HTTP requests for medication management
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { medicationService } from '../services/medicationService';

// ========== VALIDATION SCHEMAS ==========

const CreateMedicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  genericName: z.string().optional(),
  dosage: z.string().min(1, 'Dosage is required'),
  dosageUnit: z.string().default('mg'),
  frequency: z.enum(['once_daily', 'twice_daily', 'three_times_daily', 'as_needed', 'custom']),
  scheduledTimes: z.array(z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM')),
  startDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  prescribedBy: z.string().optional(),
  prescribedDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  purpose: z.string().optional(),
  instructions: z.string().optional(),
  sideEffectsToWatch: z.string().optional(),
  remindersEnabled: z.boolean().default(true),
  pharmacy: z.string().optional(),
  refillDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  notes: z.string().optional()
});

const UpdateMedicationSchema = z.object({
  name: z.string().min(1).optional(),
  genericName: z.string().optional(),
  dosage: z.string().min(1).optional(),
  dosageUnit: z.string().optional(),
  frequency: z.enum(['once_daily', 'twice_daily', 'three_times_daily', 'as_needed', 'custom']).optional(),
  scheduledTimes: z.array(z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)).optional(),
  startDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  prescribedBy: z.string().optional(),
  prescribedDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  purpose: z.string().optional(),
  instructions: z.string().optional(),
  sideEffectsToWatch: z.string().optional(),
  isActive: z.boolean().optional(),
  remindersEnabled: z.boolean().optional(),
  pharmacy: z.string().optional(),
  refillDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  notes: z.string().optional()
});

const LogMedicationSchema = z.object({
  medicationId: z.string().uuid('Invalid medication ID'),
  scheduledTime: z.string().datetime().transform(val => new Date(val)),
  takenAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  status: z.enum(['taken', 'missed', 'skipped', 'late']),
  sideEffects: z.string().optional(),
  effectiveness: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional()
});

const QueryDaysSchema = z.object({
  days: z.string().optional().default('30').transform(val => {
    const num = parseInt(val);
    if (isNaN(num) || num < 1 || num > 365) {
      throw new Error('Days must be between 1 and 365');
    }
    return num;
  })
});

const QueryMedicationSchema = z.object({
  medicationId: z.string().uuid().optional(),
  days: z.string().optional().default('30').transform(val => {
    const num = parseInt(val);
    if (isNaN(num) || num < 1 || num > 365) {
      throw new Error('Days must be between 1 and 365');
    }
    return num;
  })
});

const QueryActiveSchema = z.object({
  activeOnly: z.string().optional().default('true').transform(val => val === 'true')
});

// ========== CONTROLLER CLASS ==========

export class MedicationController {

  // ========== MEDICATION CRUD ==========

  /**
   * POST /api/medications
   * Create a new medication
   */
  async createMedication(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = CreateMedicationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid medication data',
          details: validation.error.issues
        });
      }

      const medication = await medicationService.createMedication(userId, validation.data);

      res.status(201).json({
        success: true,
        medication,
        message: 'Medication created successfully'
      });
    } catch (error: any) {
      console.error('Error creating medication:', error);
      res.status(500).json({
        error: 'Failed to create medication',
        message: error.message
      });
    }
  }

  /**
   * GET /api/medications
   * Get all medications for the user
   */
  async getUserMedications(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = QueryActiveSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: validation.error.issues
        });
      }

      const medications = await medicationService.getUserMedications(
        userId,
        validation.data.activeOnly
      );

      res.json({
        success: true,
        medications,
        count: medications.length
      });
    } catch (error: any) {
      console.error('Error fetching medications:', error);
      res.status(500).json({
        error: 'Failed to fetch medications',
        message: error.message
      });
    }
  }

  /**
   * GET /api/medications/:id
   * Get a specific medication by ID
   */
  async getMedicationById(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Medication ID is required' });
      }

      const medication = await medicationService.getMedicationById(id, userId);

      res.json({
        success: true,
        medication
      });
    } catch (error: any) {
      console.error('Error fetching medication:', error);
      const status = error.message === 'Medication not found' ? 404 : 500;
      res.status(status).json({
        error: 'Failed to fetch medication',
        message: error.message
      });
    }
  }

  /**
   * PUT /api/medications/:id
   * Update a medication
   */
  async updateMedication(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Medication ID is required' });
      }

      const validation = UpdateMedicationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid medication data',
          details: validation.error.issues
        });
      }

      const medication = await medicationService.updateMedication(id, userId, validation.data);

      res.json({
        success: true,
        medication,
        message: 'Medication updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating medication:', error);
      const status = error.message === 'Medication not found' ? 404 : 500;
      res.status(status).json({
        error: 'Failed to update medication',
        message: error.message
      });
    }
  }

  /**
   * DELETE /api/medications/:id
   * Delete a medication
   */
  async deleteMedication(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Medication ID is required' });
      }

      const result = await medicationService.deleteMedication(id, userId);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      console.error('Error deleting medication:', error);
      const status = error.message === 'Medication not found' ? 404 : 500;
      res.status(status).json({
        error: 'Failed to delete medication',
        message: error.message
      });
    }
  }

  // ========== MEDICATION LOGGING ==========

  /**
   * POST /api/medications/log
   * Log a medication dose (taken, missed, skipped, late)
   */
  async logMedicationTaken(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = LogMedicationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid log data',
          details: validation.error.issues
        });
      }

      const log = await medicationService.logMedicationTaken(userId, validation.data);

      res.status(201).json({
        success: true,
        log,
        message: 'Medication log created successfully'
      });
    } catch (error: any) {
      console.error('Error logging medication:', error);
      const status = error.message === 'Medication not found' ? 404 : 500;
      res.status(status).json({
        error: 'Failed to log medication',
        message: error.message
      });
    }
  }

  /**
   * GET /api/medications/logs
   * Get medication logs with optional filtering
   */
  async getMedicationLogs(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = QueryMedicationSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: validation.error.issues
        });
      }

      const logs = await medicationService.getMedicationLogs(
        userId,
        validation.data.medicationId,
        validation.data.days
      );

      res.json({
        success: true,
        logs,
        count: logs.length
      });
    } catch (error: any) {
      console.error('Error fetching medication logs:', error);
      res.status(500).json({
        error: 'Failed to fetch medication logs',
        message: error.message
      });
    }
  }

  // ========== SCHEDULE & ADHERENCE ==========

  /**
   * GET /api/medications/schedule/today
   * Get today's medication schedule
   */
  async getTodaysSchedule(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const schedule = await medicationService.getTodaysSchedule(userId);

      res.json({
        success: true,
        schedule,
        count: schedule.length
      });
    } catch (error: any) {
      console.error('Error fetching today\'s schedule:', error);
      res.status(500).json({
        error: 'Failed to fetch schedule',
        message: error.message
      });
    }
  }

  /**
   * GET /api/medications/adherence
   * Get adherence rate statistics
   */
  async getAdherenceRate(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = QueryMedicationSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: validation.error.issues
        });
      }

      const adherence = await medicationService.getAdherenceRate(
        userId,
        validation.data.medicationId,
        validation.data.days
      );

      res.json({
        success: true,
        adherence
      });
    } catch (error: any) {
      console.error('Error calculating adherence rate:', error);
      // Don't throw 404 - return 0% stats
      const days = parseInt(req.query.days as string) || 7;
      res.json({
        success: true,
        adherence: {
          medicationId: req.query.medicationId as string | undefined,
          days,
          adherenceRate: 0,
          totalDoses: 0,
          takenDoses: 0,
          missedDoses: 0,
          skippedDoses: 0,
          onTimeDoses: 0,
          lateDoses: 0
        }
      });
    }
  }

  /**
   * GET /api/medications/missed
   * Get missed doses
   */
  async getMissedDoses(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = QueryDaysSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: validation.error.issues
        });
      }

      const missedDoses = await medicationService.getMissedDoses(
        userId,
        validation.data.days
      );

      res.json({
        success: true,
        missedDoses,
        count: missedDoses.length
      });
    } catch (error: any) {
      console.error('Error fetching missed doses:', error);
      res.status(500).json({
        error: 'Failed to fetch missed doses',
        message: error.message
      });
    }
  }

  /**
   * GET /api/medications/side-effects
   * Get side effects summary
   */
  async getSideEffectsSummary(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { medicationId } = req.query;

      const summary = await medicationService.getSideEffectsSummary(
        userId,
        medicationId as string | undefined
      );

      res.json({
        success: true,
        summary
      });
    } catch (error: any) {
      console.error('Error fetching side effects summary:', error);
      res.status(500).json({
        error: 'Failed to fetch side effects',
        message: error.message
      });
    }
  }
}

export const medicationController = new MedicationController();
