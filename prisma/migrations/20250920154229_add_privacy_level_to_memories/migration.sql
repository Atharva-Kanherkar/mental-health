-- AlterTable
ALTER TABLE "Memory" ADD COLUMN "privacyLevel" TEXT NOT NULL DEFAULT 'server_managed';

-- Update existing records to have explicit privacy level
-- All existing memories default to server_managed for backward compatibility
UPDATE "Memory" SET "privacyLevel" = 'server_managed' WHERE "privacyLevel" IS NULL;
