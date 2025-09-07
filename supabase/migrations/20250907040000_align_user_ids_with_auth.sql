-- Align user ID fields with auth.users table
-- This ensures proper foreign key relationships and type consistency

-- Add foreign key constraints to link user fields with auth.users
-- Note: We use ON DELETE SET NULL for optional relationships and ON DELETE CASCADE for required ones

-- Events: creatorId and updatedBy must reference valid users
ALTER TABLE "public"."hx2-audience_event" 
  ADD CONSTRAINT "fk_event_creator" 
  FOREIGN KEY ("creatorId") 
  REFERENCES "auth"."users"("id") 
  ON DELETE CASCADE;

ALTER TABLE "public"."hx2-audience_event" 
  ADD CONSTRAINT "fk_event_updater" 
  FOREIGN KEY ("updatedBy") 
  REFERENCES "auth"."users"("id") 
  ON DELETE SET NULL;

-- Activities: updatedBy should reference valid users
ALTER TABLE "public"."hx2-audience_activity" 
  ADD CONSTRAINT "fk_activity_updater" 
  FOREIGN KEY ("updatedBy") 
  REFERENCES "auth"."users"("id") 
  ON DELETE SET NULL;

-- Questions: submitterUserId is optional, updatedBy should reference valid users
ALTER TABLE "public"."hx2-audience_question" 
  ADD CONSTRAINT "fk_question_submitter" 
  FOREIGN KEY ("submitterUserId") 
  REFERENCES "auth"."users"("id") 
  ON DELETE SET NULL;

ALTER TABLE "public"."hx2-audience_question" 
  ADD CONSTRAINT "fk_question_updater" 
  FOREIGN KEY ("updatedBy") 
  REFERENCES "auth"."users"("id") 
  ON DELETE SET NULL;

-- Activity responses: userId must reference valid users
ALTER TABLE "public"."hx2-audience_activity_response" 
  ADD CONSTRAINT "fk_response_user" 
  FOREIGN KEY ("userId") 
  REFERENCES "auth"."users"("id") 
  ON DELETE CASCADE;

-- Create indexes on foreign key columns for better performance
CREATE INDEX IF NOT EXISTS "idx_event_creator" ON "public"."hx2-audience_event" ("creatorId");
CREATE INDEX IF NOT EXISTS "idx_event_updater" ON "public"."hx2-audience_event" ("updatedBy");
CREATE INDEX IF NOT EXISTS "idx_activity_updater" ON "public"."hx2-audience_activity" ("updatedBy");
CREATE INDEX IF NOT EXISTS "idx_question_submitter" ON "public"."hx2-audience_question" ("submitterUserId");
CREATE INDEX IF NOT EXISTS "idx_question_updater" ON "public"."hx2-audience_question" ("updatedBy");
CREATE INDEX IF NOT EXISTS "idx_response_user" ON "public"."hx2-audience_activity_response" ("userId");