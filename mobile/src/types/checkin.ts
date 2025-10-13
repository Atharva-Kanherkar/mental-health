/**
 * Daily Check-in Type Definitions
 * Types for daily mental health check-ins
 */

export interface DailyCheckIn {
  id: string;
  userId: string;
  date: string;
  overallMood?: number;
  energyLevel?: number;
  sleepQuality?: number;
  stressLevel?: number;
  anxietyLevel?: number;

  // Safety questions
  hadSelfHarmThoughts?: boolean;
  hadSuicidalThoughts?: boolean;
  actedOnHarm?: boolean;

  // Positive behaviors
  exercised?: boolean;
  ateWell?: boolean;
  socializedHealthily?: boolean;
  practicedSelfCare?: boolean;
  tookMedication?: boolean;

  // Optional reflection
  gratefulFor?: string;
  challengesToday?: string;
  accomplishments?: string;

  pointsEarned: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCheckInData {
  date: string;
  userId: string;
  overallMood?: number;
  energyLevel?: number;
  sleepQuality?: number;
  stressLevel?: number;
  anxietyLevel?: number;
  hadSelfHarmThoughts?: boolean;
  hadSuicidalThoughts?: boolean;
  actedOnHarm?: boolean;
  exercised?: boolean;
  ateWell?: boolean;
  socializedHealthily?: boolean;
  practicedSelfCare?: boolean;
  tookMedication?: boolean;
  gratefulFor?: string;
  challengesToday?: string;
  accomplishments?: string;
}

export interface MoodTrend {
  date: string;
  overallMood?: number;
  energyLevel?: number;
  stressLevel?: number;
  anxietyLevel?: number;
}

export interface CrisisResource {
  name: string;
  phone: string;
  text?: string;
  website?: string;
  description: string;
}

export interface CheckInResponse {
  success: boolean;
  checkIn: DailyCheckIn;
}

export interface CheckInsListResponse {
  success: boolean;
  checkIns: DailyCheckIn[];
}

export interface MoodTrendsResponse {
  success: boolean;
  trends: MoodTrend[];
}

export interface CrisisResourcesResponse {
  success: boolean;
  resources: CrisisResource[];
}
