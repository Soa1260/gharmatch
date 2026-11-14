-- Landlord tools: screening questions on a home, who may send requests, and the answers saved with an interest.
ALTER TABLE "Listing" ADD COLUMN "screeningQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Listing" ADD COLUMN "requestsFrom" TEXT NOT NULL DEFAULT 'ANYONE';
ALTER TABLE "Interest" ADD COLUMN "screening" TEXT;
