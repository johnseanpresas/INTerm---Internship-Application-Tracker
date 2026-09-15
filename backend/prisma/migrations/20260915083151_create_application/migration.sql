-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "workSetup" TEXT NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL,
    "jobUrl" TEXT,
    "source" TEXT,
    "salaryAmount" DECIMAL(65,30),
    "salaryCurrency" TEXT,
    "salaryPeriod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);
