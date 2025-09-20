-- AlterTable
ALTER TABLE "public"."Memory" ADD COLUMN     "associatedPersonId" TEXT,
ADD COLUMN     "encryptionAuthTag" TEXT,
ADD COLUMN     "encryptionIV" TEXT,
ADD COLUMN     "fileKey" TEXT,
ADD COLUMN     "fileMimeType" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "isEncrypted" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "public"."Memory" ADD CONSTRAINT "Memory_associatedPersonId_fkey" FOREIGN KEY ("associatedPersonId") REFERENCES "public"."FavPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
