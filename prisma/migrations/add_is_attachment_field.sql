-- Add isAttachment field to Memory model to distinguish profile photos/voice notes from actual memories
ALTER TABLE "Memory" ADD COLUMN "isAttachment" BOOLEAN DEFAULT false;

-- Mark existing profile photos, voice notes, and video notes as attachments
-- (These have titles like "Profile Photo" or "Voice Note")
UPDATE "Memory" SET "isAttachment" = true 
WHERE title LIKE '%Profile Photo%' 
   OR title LIKE '%Voice Note%' 
   OR title LIKE '%Video Note%';

-- Create index for faster filtering
CREATE INDEX idx_memory_attachment ON "Memory"("isAttachment");
