-- Who posted the home (owner, family member, caretaker or agent), and when they confirmed they are authorised to let it.
ALTER TABLE "Listing" ADD COLUMN "postedBy" TEXT NOT NULL DEFAULT 'OWNER';
ALTER TABLE "Listing" ADD COLUMN "authorisationDeclaredAt" TIMESTAMP(3);
