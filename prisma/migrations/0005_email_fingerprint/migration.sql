-- A one-way fingerprint of the email, kept only for accounts deleted while a safety report about them was open or upheld.
ALTER TABLE "User" ADD COLUMN "emailHash" TEXT;
CREATE INDEX "User_emailHash_idx" ON "User"("emailHash");
