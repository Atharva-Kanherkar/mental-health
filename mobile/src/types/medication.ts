/**
 * Medication Management Types
 */

export interface Medication {
  id: string;
  userId: string;
  name: string;
  genericName?: string;
  dosage: string;
  dosageUnit: string;
  frequency: string;
  scheduledTimes: string[];
  startDate: string;
  endDate?: string;
  prescribedBy?: string;
  prescribedDate?: string;
  purpose?: string;
  instructions?: string;
  sideEffectsToWatch?: string;
  isActive: boolean;
  remindersEnabled: boolean;
  pharmacy?: string;
  refillDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationLog {
  id: string;
  userId: string;
  medicationId: string;
  scheduledTime: string;
  takenAt?: string;
  status: 'pending' | 'taken' | 'missed' | 'skipped' | 'late';  // Added 'late'
  sideEffects?: string;
  effectiveness?: number;
  notes?: string;
  medication?: Medication;
  createdAt: string;
}

export interface CreateMedicationData {
  name: string;
  genericName?: string;
  dosage: string;
  dosageUnit: string;
  frequency: string;
  scheduledTimes: string[];
  startDate?: string;
  endDate?: string;
  prescribedBy?: string;
  prescribedDate?: string;
  purpose?: string;
  instructions?: string;
  sideEffectsToWatch?: string;
  remindersEnabled?: boolean;
  pharmacy?: string;
  refillDate?: string;
  notes?: string;
}

export interface UpdateMedicationData {
  name?: string;
  genericName?: string;
  dosage?: string;
  dosageUnit?: string;
  frequency?: string;
  scheduledTimes?: string[];
  startDate?: string;
  endDate?: string;
  prescribedBy?: string;
  prescribedDate?: string;
  purpose?: string;
  instructions?: string;
  sideEffectsToWatch?: string;
  isActive?: boolean;
  remindersEnabled?: boolean;
  pharmacy?: string;
  refillDate?: string;
  notes?: string;
}

export interface LogDoseData {
  medicationId: string;
  scheduledTime: string;
  takenAt?: string;
  status: 'taken' | 'missed' | 'skipped' | 'late';
  sideEffects?: string;
  effectiveness?: number;
  notes?: string;
}

export interface TodaysSchedule {
  date: string;
  medications: Array<{
    medication: Medication;
    scheduledTime: string;
    status: 'pending' | 'taken' | 'missed' | 'skipped' | 'late';  // Added 'late'
    log?: MedicationLog;
  }>;
  summary: {
    total: number;
    taken: number;
    missed: number;
    pending: number;
  };
}

// Backend returns array directly, not nested in object
export type TodaysScheduleItem = {
  medicationId: string;
  medicationName: string;
  dosage: string;
  dosageUnit: string;
  scheduledTime: string;  // ISO datetime
  status: 'pending' | 'taken' | 'missed' | 'skipped' | 'late';
  takenAt: string | null;
  logId: string | null;
};

export interface AdherenceStats {
  medicationId?: string;
  days: number;
  adherenceRate: number;
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  skippedDoses: number;
  onTimeDoses: number;
  lateDoses: number;
}

export interface MissedDose {
  id: string;
  medication: Medication;
  scheduledTime: string;
  missedAt: string;
}

export interface SideEffect {
  medicationId: string;
  medicationName: string;
  sideEffect: string;
  frequency: number;
  lastReported: string;
}

// API Response Types
export interface MedicationResponse {
  success: boolean;
  data: {
    medication: Medication;
  };
}

export interface MedicationsListResponse {
  success: boolean;
  data: {
    medications: Medication[];
    total: number;
  };
}

export interface MedicationLogResponse {
  success: boolean;
  data: {
    log: MedicationLog;
  };
}

export interface MedicationLogsListResponse {
  success: boolean;
  data: {
    logs: MedicationLog[];
    total: number;
  };
}

export interface TodaysScheduleResponse {
  success: boolean;
  data: TodaysSchedule;
}

export interface AdherenceStatsResponse {
  success: boolean;
  data: AdherenceStats;
}

export interface MissedDosesResponse {
  success: boolean;
  data: {
    missedDoses: MissedDose[];
    total: number;
  };
}

export interface SideEffectsResponse {
  success: boolean;
  data: {
    sideEffects: SideEffect[];
  };
}
