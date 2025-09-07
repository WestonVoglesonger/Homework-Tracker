-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isWaitlisted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),
    "convertedBy" TEXT,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_userId_key" ON "Waitlist"("userId");

-- CreateIndex
CREATE INDEX "Waitlist_joinedAt_idx" ON "Waitlist"("joinedAt");

-- CreateIndex
CREATE INDEX "Waitlist_convertedAt_idx" ON "Waitlist"("convertedAt");

-- AddForeignKey
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_convertedBy_fkey" FOREIGN KEY ("convertedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
