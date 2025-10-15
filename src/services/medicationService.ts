/**
 * Medication Management Service
 * Handles medication tracking, adherence logging, and analytics
 * Updated: 2025-10-15
 */

import prisma from '../prisma/client';

export interface CreateMedicationData {
  name: string;
  genericName?: string;
  dosage: string;
  dosageUnit?: string;
  frequency: 'once_daily' | 'twice_daily' | 'three_times_daily' | 'as_needed' | 'custom';
  scheduledTimes: string[]; // ["08:00", "20:00"]
  startDate?: Date;
  endDate?: Date;
  prescribedBy?: string;
  prescribedDate?: Date;
  purpose?: string;
  instructions?: string;
  sideEffectsToWatch?: string;
  remindersEnabled?: boolean;
  pharmacy?: string;
  refillDate?: Date;
  notes?: string;
}

export interface UpdateMedicationData extends Partial<CreateMedicationData> {
  isActive?: boolean;
}

export interface LogMedicationData {
  medicationId: string;
  scheduledTime: Date;
  takenAt?: Date;
  status: 'taken' | 'missed' | 'skipped' | 'late';
  sideEffects?: string;
  effectiveness?: number; // 1-5
  notes?: string;
}

class MedicationService {

  // ========== CRUD OPERATIONS ==========

  /**
   * Create a new medication
   */
  async createMedication(userId: string, data: CreateMedicationData) {
    try {
      const medication = await prisma.medication.create({
        data: {
          userId,
          name: data.name,
          genericName: data.genericName,
          dosage: data.dosage,
          dosageUnit: data.dosageUnit || 'mg',
          frequency: data.frequency,
          scheduledTimes: data.scheduledTimes,
          startDate: data.startDate || new Date(),
          endDate: data.endDate,
          prescribedBy: data.prescribedBy,
          prescribedDate: data.prescribedDate,
          purpose: data.purpose,
          instructions: data.instructions,
          sideEffectsToWatch: data.sideEffectsToWatch,
          remindersEnabled: data.remindersEnabled !== undefined ? data.remindersEnabled : true,
          pharmacy: data.pharmacy,
          refillDate: data.refillDate,
          notes: data.notes
        },
        include: {
          logs: {
            orderBy: { scheduledTime: 'desc' },
            take: 10
          }
        }
      });

      console.log(`[MedicationService] Created medication ${medication.id} for user ${userId}`);
      return medication;
    } catch (error) {
      console.error('[MedicationService] Error creating medication:', error);
      throw new Error('Failed to create medication');
    }
  }

  /**
   * Get all medications for a user
   */
  async getUserMedications(userId: string, activeOnly: boolean = true) {
    try {
      console.log(`[MedicationService] getUserMedications for userId: ${userId}, activeOnly: ${activeOnly}`);

      const where: any = { userId };
      if (activeOnly) {
        where.isActive = true;
      }

      const medications = await prisma.medication.findMany({
        where,
        include: {
          logs: {
            orderBy: { scheduledTime: 'desc' },
            take: 5
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`[MedicationService] Found ${medications.length} medications for user ${userId}`);
      if (medications.length > 0) {
        console.log(`[MedicationService] First medication ID: ${medications[0].id}, userId: ${medications[0].userId}`);
      }

      return medications;
    } catch (error) {
      console.error('[MedicationService] Error fetching medications:', error);
      throw new Error('Failed to fetch medications');
    }
  }

  /**
   * Get a specific medication by ID
   */
  async getMedicationById(medicationId: string, userId: string) {
    try {
      const medication = await prisma.medication.findFirst({
        where: {
          id: medicationId,
          userId // Security: ensure user owns this medication
        },
        include: {
          logs: {
            orderBy: { scheduledTime: 'desc' },
            take: 30
          }
        }
      });

      if (!medication) {
        throw new Error('Medication not found');
      }

      return medication;
    } catch (error) {
      console.error('[MedicationService] Error fetching medication:', error);
      throw error;
    }
  }

  /**
   * Update a medication
   */
  async updateMedication(medicationId: string, userId: string, data: UpdateMedicationData) {
    try {
      // First verify ownership
      const existing = await prisma.medication.findFirst({
        where: { id: medicationId, userId }
      });

      if (!existing) {
        throw new Error('Medication not found');
      }

      const medication = await prisma.medication.update({
        where: { id: medicationId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.genericName !== undefined && { genericName: data.genericName }),
          ...(data.dosage && { dosage: data.dosage }),
          ...(data.dosageUnit && { dosageUnit: data.dosageUnit }),
          ...(data.frequency && { frequency: data.frequency }),
          ...(data.scheduledTimes && { scheduledTimes: data.scheduledTimes }),
          ...(data.startDate && { startDate: data.startDate }),
          ...(data.endDate !== undefined && { endDate: data.endDate }),
          ...(data.prescribedBy !== undefined && { prescribedBy: data.prescribedBy }),
          ...(data.prescribedDate !== undefined && { prescribedDate: data.prescribedDate }),
          ...(data.purpose !== undefined && { purpose: data.purpose }),
          ...(data.instructions !== undefined && { instructions: data.instructions }),
          ...(data.sideEffectsToWatch !== undefined && { sideEffectsToWatch: data.sideEffectsToWatch }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.remindersEnabled !== undefined && { remindersEnabled: data.remindersEnabled }),
          ...(data.pharmacy !== undefined && { pharmacy: data.pharmacy }),
          ...(data.refillDate !== undefined && { refillDate: data.refillDate }),
          ...(data.notes !== undefined && { notes: data.notes })
        },
        include: {
          logs: {
            orderBy: { scheduledTime: 'desc' },
            take: 10
          }
        }
      });

      console.log(`[MedicationService] Updated medication ${medicationId} for user ${userId}`);
      return medication;
    } catch (error) {
      console.error('[MedicationService] Error updating medication:', error);
      throw error;
    }
  }

  /**
   * Delete a medication
   */
  async deleteMedication(medicationId: string, userId: string) {
    try {
      // First verify ownership
      const existing = await prisma.medication.findFirst({
        where: { id: medicationId, userId }
      });

      if (!existing) {
        throw new Error('Medication not found');
      }

      // Prisma will cascade delete all related logs
      await prisma.medication.delete({
        where: { id: medicationId }
      });

      console.log(`[MedicationService] Deleted medication ${medicationId} for user ${userId}`);
      return { success: true, message: 'Medication deleted successfully' };
    } catch (error) {
      console.error('[MedicationService] Error deleting medication:', error);
      throw error;
    }
  }

  // ========== LOGGING & ADHERENCE ==========

  /**
   * Log medication taken
   * Improvements:
   * - Prevents duplicate logs (updates existing instead)
   * - Auto-calculates "late" status based on time difference
   * - Validates timing constraints
   */
  async logMedicationTaken(userId: string, data: LogMedicationData) {
    try {
      // Verify medication belongs to user
      const medication = await prisma.medication.findFirst({
        where: { id: data.medicationId, userId }
      });

      if (!medication) {
        throw new Error('Medication not found');
      }

      // Simpler duplicate check: Find exact scheduledTime match (within 5 minute window)
      const scheduledDate = new Date(data.scheduledTime);
      const fiveMinsBefore = new Date(scheduledDate.getTime() - 5 * 60 * 1000);
      const fiveMinsAfter = new Date(scheduledDate.getTime() + 5 * 60 * 1000);

      const existingLog = await prisma.medicationLog.findFirst({
        where: {
          userId,
          medicationId: data.medicationId,
          scheduledTime: {
            gte: fiveMinsBefore,
            lte: fiveMinsAfter
          }
        }
      });

      console.log('[MedicationService] Checking for duplicate - scheduledTime:', data.scheduledTime);
      console.log('[MedicationService] Existing log found:', !!existingLog, existingLog?.id);

      // Auto-calculate status based on time difference
      let finalStatus = data.status;
      
      if (data.status === 'taken' && data.takenAt) {
        const scheduledTime = new Date(data.scheduledTime);
        const takenTime = new Date(data.takenAt);
        const diffMs = takenTime.getTime() - scheduledTime.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // If taken more than 2 hours late, auto-mark as "late"
        const LATE_THRESHOLD_HOURS = 2;
        
        if (diffHours > LATE_THRESHOLD_HOURS) {
          finalStatus = 'late';
          console.log(`[MedicationService] Auto-marked as late: ${diffHours.toFixed(1)}h after scheduled time`);
        } else if (diffHours < -0.5) {
          // Taken more than 30 minutes EARLY - log warning but allow
          console.log(`[MedicationService] WARNING: Dose logged ${Math.abs(diffHours).toFixed(1)}h before scheduled time`);
        }
      }

      // If existing log found with exact time match, UPDATE instead of creating duplicate
      if (existingLog) {
        const updatedLog = await prisma.medicationLog.update({
          where: { id: existingLog.id },
          data: {
            takenAt: data.takenAt,
            status: finalStatus,
            sideEffects: data.sideEffects,
            effectiveness: data.effectiveness,
            notes: data.notes
          },
          include: {
            medication: true
          }
        });

        console.log(`[MedicationService] Updated existing log ${existingLog.id} with status ${finalStatus}`);
        return updatedLog;
      }

      // No existing log found, create new one
      const log = await prisma.medicationLog.create({
        data: {
          userId,
          medicationId: data.medicationId,
          scheduledTime: data.scheduledTime,
          takenAt: data.takenAt,
          status: finalStatus,
          sideEffects: data.sideEffects,
          effectiveness: data.effectiveness,
          notes: data.notes
        },
        include: {
          medication: true
        }
      });

      console.log(`[MedicationService] Created new log with status ${finalStatus} for ${data.medicationId}`);
      return log;
    } catch (error) {
      console.error('[MedicationService] Error logging medication:', error);
      throw error;
    }
  }

  /**
   * Get medication logs
   */
  async getMedicationLogs(userId: string, medicationId?: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const where: any = {
        userId,
        scheduledTime: { gte: startDate }
      };

      if (medicationId) {
        where.medicationId = medicationId;
      }

      const logs = await prisma.medicationLog.findMany({
        where,
        include: {
          medication: {
            select: {
              id: true,
              name: true,
              dosage: true,
              dosageUnit: true
            }
          }
        },
        orderBy: { scheduledTime: 'desc' }
      });

      return logs;
    } catch (error) {
      console.error('[MedicationService] Error fetching medication logs:', error);
      throw error;
    }
  }

  /**
   * Get today's medication schedule
   */
  async getTodaysSchedule(userId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      console.log('[MedicationService] getTodaysSchedule for userId:', userId);
      console.log('[MedicationService] Today range:', today.toISOString(), 'to', tomorrow.toISOString());

      // Get active medications
      const medications = await prisma.medication.findMany({
        where: {
          userId,
          isActive: true,
          OR: [
            { endDate: null },
            { endDate: { gte: today } }
          ]
        },
        include: {
          logs: {
            where: {
              scheduledTime: {
                gte: today,
                lt: tomorrow
              }
            },
            orderBy: {
              scheduledTime: 'desc'
            }
          }
        }
      });

      console.log('[MedicationService] Found', medications.length, 'active medications');

      // Generate schedule with status
      const schedule = medications.flatMap(medication => {
        return medication.scheduledTimes.map(time => {
          const [hours, minutes] = time.split(':').map(Number);
          const scheduledTime = new Date(today);
          scheduledTime.setHours(hours, minutes, 0, 0);

          // Check if there's a log for this scheduled time (within same hour and minute)
          const log = medication.logs.find(l => {
            const logTime = new Date(l.scheduledTime);
            const isSameDay = logTime >= today && logTime < tomorrow;
            const isSameTime = logTime.getHours() === hours && logTime.getMinutes() === minutes;
            return isSameDay && isSameTime;
          });

          const scheduleItem = {
            medicationId: medication.id,
            medicationName: medication.name,
            dosage: medication.dosage,
            dosageUnit: medication.dosageUnit,
            scheduledTime: scheduledTime.toISOString(),
            status: log ? log.status : 'pending',
            takenAt: log?.takenAt || null,
            logId: log?.id || null
          };

          console.log('[MedicationService] Schedule item:', medication.name, time, '→', scheduleItem.status, 'log:', !!log);

          return scheduleItem;
        });
      });

      // Sort by scheduled time
      schedule.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

      console.log('[MedicationService] Generated', schedule.length, 'schedule items');

      return schedule;
    } catch (error) {
      console.error('[MedicationService] Error fetching today\'s schedule:', error);
      throw error;
    }
  }

  // ========== ANALYTICS ==========

  /**
   * Calculate adherence rate
   */
  async getAdherenceRate(userId: string, medicationId?: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const where: any = {
        userId,
        scheduledTime: { gte: startDate }
      };

      if (medicationId) {
        where.medicationId = medicationId;
      }

      const totalLogs = await prisma.medicationLog.count({ where });
      const takenLogs = await prisma.medicationLog.count({
        where: { ...where, status: 'taken' }
      });

      const adherenceRate = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 0;

      return {
        medicationId,
        days,
        adherenceRate,
        totalDoses: totalLogs,
        takenDoses: takenLogs,
        missedDoses: 0,
        skippedDoses: 0,
        onTimeDoses: 0,
        lateDoses: 0
      };
    } catch (error) {
      console.error('[MedicationService] Error calculating adherence rate:', error);
      // Return 0% instead of throwing
      return {
        medicationId,
        days,
        adherenceRate: 0,
        totalDoses: 0,
        takenDoses: 0,
        missedDoses: 0,
        skippedDoses: 0,
        onTimeDoses: 0,
        lateDoses: 0
      };
    }
  }

  /**
   * Get missed doses
   */
  async getMissedDoses(userId: string, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const missedLogs = await prisma.medicationLog.findMany({
        where: {
          userId,
          scheduledTime: { gte: startDate },
          status: { in: ['missed', 'skipped'] }
        },
        include: {
          medication: {
            select: {
              id: true,
              name: true,
              dosage: true,
              dosageUnit: true
            }
          }
        },
        orderBy: { scheduledTime: 'desc' }
      });

      return missedLogs;
    } catch (error) {
      console.error('[MedicationService] Error fetching missed doses:', error);
      throw error;
    }
  }

  /**
   * Get side effects summary
   */
  async getSideEffectsSummary(userId: string, medicationId?: string) {
    try {
      const where: any = {
        userId,
        sideEffects: { not: null }
      };

      if (medicationId) {
        where.medicationId = medicationId;
      }

      const logs = await prisma.medicationLog.findMany({
        where,
        include: {
          medication: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Group side effects by medication
      const summary: { [key: string]: any } = {};

      logs.forEach(log => {
        const medId = log.medication.id;
        if (!summary[medId]) {
          summary[medId] = {
            medicationId: medId,
            medicationName: log.medication.name,
            sideEffects: [],
            count: 0
          };
        }

        if (log.sideEffects) {
          summary[medId].sideEffects.push({
            date: log.scheduledTime,
            sideEffects: log.sideEffects,
            effectiveness: log.effectiveness
          });
          summary[medId].count++;
        }
      });

      return Object.values(summary);
    } catch (error) {
      console.error('[MedicationService] Error fetching side effects summary:', error);
      throw error;
    }
  }

  /**
   * Generate scheduled logs for a specific date
   * This can be used for batch creation or reminders
   */
  async generateScheduledLogs(userId: string, date: Date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get active medications
      const medications = await prisma.medication.findMany({
        where: {
          userId,
          isActive: true,
          startDate: { lte: endOfDay },
          OR: [
            { endDate: null },
            { endDate: { gte: startOfDay } }
          ]
        }
      });

      // Generate logs for each medication's scheduled times
      const logsToCreate = [];

      for (const medication of medications) {
        for (const time of medication.scheduledTimes) {
          const [hours, minutes] = time.split(':').map(Number);
          const scheduledTime = new Date(startOfDay);
          scheduledTime.setHours(hours, minutes, 0, 0);

          // Check if log already exists
          const existingLog = await prisma.medicationLog.findFirst({
            where: {
              userId,
              medicationId: medication.id,
              scheduledTime
            }
          });

          if (!existingLog) {
            logsToCreate.push({
              userId,
              medicationId: medication.id,
              scheduledTime,
              status: 'pending'
            });
          }
        }
      }

      // Batch create logs
      if (logsToCreate.length > 0) {
        await prisma.medicationLog.createMany({
          data: logsToCreate
        });

        console.log(`[MedicationService] Generated ${logsToCreate.length} scheduled logs for ${date.toDateString()}`);
      }

      return logsToCreate.length;
    } catch (error) {
      console.error('[MedicationService] Error generating scheduled logs:', error);
      throw error;
    }
  }

  /**
   * Check if all medications were taken today
   * Used for daily check-in integration
   */
  async wasAllMedicationTakenToday(userId: string): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const now = new Date();

      // Get today's schedule
      const schedule = await this.getTodaysSchedule(userId);

      // Filter to only scheduled times that have already passed
      const dueSchedule = schedule.filter(item => {
        const scheduledTime = new Date(item.scheduledTime);
        return scheduledTime <= now;
      });

      if (dueSchedule.length === 0) {
        // No medications scheduled for times that have passed
        return true;
      }

      // Check if all due medications were taken
      const allTaken = dueSchedule.every(item => item.status === 'taken');

      return allTaken;
    } catch (error) {
      console.error('[MedicationService] Error checking medication adherence:', error);
      return false;
    }
  }
}

export const medicationService = new MedicationService();
