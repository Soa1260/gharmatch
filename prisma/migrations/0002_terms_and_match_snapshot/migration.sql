-- Record when each person accepted the Terms and Privacy Policy, and which version.
ALTER TABLE "User" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "termsVersion" TEXT;

-- Save the home's house rules at the moment an interest is accepted, for neutral facilitation of later disputes.
ALTER TABLE "Interest" ADD COLUMN "matchSnapshot" TEXT;
