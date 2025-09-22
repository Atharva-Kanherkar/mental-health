-- CreateTable
CREATE TABLE "public"."MentalHealthProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "occupation" TEXT,
    "educationLevel" TEXT,
    "relationshipStatus" TEXT,
    "livingArrangement" TEXT,
    "primaryConcerns" TEXT[],
    "diagnosedConditions" TEXT[],
    "symptomSeverity" TEXT,
    "symptomDuration" TEXT,
    "suicidalIdeation" BOOLEAN NOT NULL DEFAULT false,
    "selfHarmHistory" BOOLEAN NOT NULL DEFAULT false,
    "substanceUseRisk" TEXT,
    "eatingDisorderRisk" TEXT,
    "hasTherapyHistory" BOOLEAN NOT NULL DEFAULT false,
    "hasMedicationHistory" BOOLEAN NOT NULL DEFAULT false,
    "hasHospitalization" BOOLEAN NOT NULL DEFAULT false,
    "familySupport" TEXT,
    "friendSupport" TEXT,
    "professionalSupport" TEXT,
    "sleepQuality" TEXT,
    "exerciseFrequency" TEXT,
    "nutritionQuality" TEXT,
    "socialConnection" TEXT,
    "privacyLevel" TEXT NOT NULL DEFAULT 'zero_knowledge',
    "consentToAnalysis" BOOLEAN NOT NULL DEFAULT false,
    "consentToInsights" BOOLEAN NOT NULL DEFAULT false,
    "dataRetentionPeriod" INTEGER NOT NULL DEFAULT 365,
    "lastAssessmentDate" TIMESTAMP(3),
    "profileCompleteness" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "riskLevel" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentalHealthProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssessmentResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "assessmentVersion" TEXT NOT NULL DEFAULT '1.0',
    "responses" JSONB NOT NULL,
    "totalScore" INTEGER,
    "severity" TEXT,
    "interpretation" TEXT,
    "recommendations" TEXT[],
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "triggeredBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MedicationHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "dosage" TEXT,
    "frequency" TEXT,
    "prescribedBy" TEXT,
    "isCurrentlyTaking" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "effectiveness" TEXT,
    "sideEffects" TEXT[],
    "adherence" TEXT,
    "reasonForStopping" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TherapyHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "therapyType" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "providerName" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "frequency" TEXT,
    "sessionCount" INTEGER,
    "effectiveness" TEXT,
    "reasonForEnding" TEXT,
    "isOngoing" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TherapyHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CrisisEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "crisisType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "triggeringEvents" TEXT[],
    "warningSignsUsed" TEXT[],
    "copingStrategies" TEXT[],
    "interventionUsed" TEXT[],
    "outcome" TEXT,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "followUpReceived" BOOLEAN NOT NULL DEFAULT false,
    "safetyPlanUsed" BOOLEAN NOT NULL DEFAULT false,
    "safetyPlanEffective" BOOLEAN,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrisisEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssessmentQuestionnaire" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "validated" BOOLEAN NOT NULL DEFAULT true,
    "reliability" DOUBLE PRECISION,
    "reference" TEXT,
    "questions" JSONB NOT NULL,
    "scoring" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentQuestionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MentalHealthProfile_userId_key" ON "public"."MentalHealthProfile"("userId");

-- CreateIndex
CREATE INDEX "AssessmentResponse_userId_assessmentType_idx" ON "public"."AssessmentResponse"("userId", "assessmentType");

-- CreateIndex
CREATE INDEX "MedicationHistory_userId_isCurrentlyTaking_idx" ON "public"."MedicationHistory"("userId", "isCurrentlyTaking");

-- CreateIndex
CREATE INDEX "TherapyHistory_userId_isOngoing_idx" ON "public"."TherapyHistory"("userId", "isOngoing");

-- CreateIndex
CREATE INDEX "CrisisEvent_userId_crisisType_idx" ON "public"."CrisisEvent"("userId", "crisisType");

-- CreateIndex
CREATE INDEX "CrisisEvent_userId_createdAt_idx" ON "public"."CrisisEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentQuestionnaire_shortName_version_key" ON "public"."AssessmentQuestionnaire"("shortName", "version");

-- AddForeignKey
ALTER TABLE "public"."MentalHealthProfile" ADD CONSTRAINT "MentalHealthProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicationHistory" ADD CONSTRAINT "MedicationHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TherapyHistory" ADD CONSTRAINT "TherapyHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CrisisEvent" ADD CONSTRAINT "CrisisEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
