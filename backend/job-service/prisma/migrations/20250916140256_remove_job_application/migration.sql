/*
  Warnings:

  - You are about to drop the `JobApplication` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "JobApplication" DROP CONSTRAINT "JobApplication_jobId_fkey";

-- DropTable
DROP TABLE "JobApplication";
