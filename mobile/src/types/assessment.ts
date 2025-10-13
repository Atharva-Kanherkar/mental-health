/**
 * Assessment Type Definitions
 * Types for mental health assessments and questionnaires
 */

export interface AssessmentQuestion {
  id: string;
  questionnaireId: string;
  text: string;
  type: 'multiple_choice' | 'scale' | 'yes_no' | 'text';
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  order: number;
}

export interface AssessmentQuestionnaire {
  id: string;
  title: string;
  type: 'PHQ-9' | 'GAD-7' | 'PCL-5' | 'MDQ' | 'custom';
  description: string;
  instructions?: string;
  questions?: AssessmentQuestion[];
  isActive: boolean;
  createdAt: string;
}

export interface AssessmentResponse {
  id: string;
  userId: string;
  questionnaireId: string;
  questionnaire: AssessmentQuestionnaire;
  responses: Record<string, string | number>;
  totalScore?: number;
  riskLevel?: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';
  submittedAt: string;
}

export interface QuestionnairePreview {
  totalScore: number;
  riskLevel: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';
  interpretation: string;
  recommendations: string[];
}

export interface QuestionnaireListResponse {
  success: boolean;
  questionnaires: AssessmentQuestionnaire[];
}

export interface QuestionnaireDetailResponse {
  success: boolean;
  questionnaire: AssessmentQuestionnaire;
}

export interface SubmitResponseData {
  responses: Record<string, string | number>;
}

export interface AssessmentResponseApiResponse {
  success: boolean;
  response: AssessmentResponse;
}

export interface PreviewScoreResponse {
  success: boolean;
  preview: QuestionnairePreview;
}

export interface UserResponsesListResponse {
  success: boolean;
  responses: AssessmentResponse[];
}
