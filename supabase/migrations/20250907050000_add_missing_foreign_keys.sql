-- Add missing foreign key constraints for referential integrity
-- This ensures data consistency across all table relationships

-- Activities reference events
ALTER TABLE "public"."hx2-audience_activity" 
  ADD CONSTRAINT "fk_activity_event" 
  FOREIGN KEY ("eventId") 
  REFERENCES "public"."hx2-audience_event"("id") 
  ON DELETE CASCADE;

-- Activity responses reference activities
ALTER TABLE "public"."hx2-audience_activity_response" 
  ADD CONSTRAINT "fk_response_activity" 
  FOREIGN KEY ("activityId") 
  REFERENCES "public"."hx2-audience_activity"("id") 
  ON DELETE CASCADE;

-- Questions reference events
ALTER TABLE "public"."hx2-audience_question" 
  ADD CONSTRAINT "fk_question_event" 
  FOREIGN KEY ("eventId") 
  REFERENCES "public"."hx2-audience_event"("id") 
  ON DELETE CASCADE;

-- Presenter state references events (one-to-one relationship)
ALTER TABLE "public"."hx2-audience_presenter_state" 
  ADD CONSTRAINT "fk_presenter_state_event" 
  FOREIGN KEY ("eventId") 
  REFERENCES "public"."hx2-audience_event"("id") 
  ON DELETE CASCADE;

-- Add unique constraint to ensure one response per user per activity
ALTER TABLE "public"."hx2-audience_activity_response" 
  ADD CONSTRAINT "uq_activity_response_user" 
  UNIQUE ("activityId", "userId");

-- Add check constraints for data validation
ALTER TABLE "public"."hx2-audience_event" 
  ADD CONSTRAINT "chk_event_time_range" 
  CHECK ("start" < "end");

ALTER TABLE "public"."hx2-audience_event" 
  ADD CONSTRAINT "chk_event_shortId_format" 
  CHECK ("shortId" ~ '^[A-Za-z0-9]{6}$' OR "shortId" IS NULL);

ALTER TABLE "public"."hx2-audience_activity" 
  ADD CONSTRAINT "chk_activity_order_positive" 
  CHECK ("order" >= 0);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "idx_activity_event_order" 
  ON "public"."hx2-audience_activity" ("eventId", "order") 
  WHERE "deleted" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_question_event_created" 
  ON "public"."hx2-audience_question" ("eventId", "createdAt") 
  WHERE "deleted" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_response_user_activity" 
  ON "public"."hx2-audience_activity_response" ("userId", "activityId");

-- Add index for event lookup by shortId (frequently queried)
CREATE INDEX IF NOT EXISTS "idx_event_shortId_active" 
  ON "public"."hx2-audience_event" ("shortId") 
  WHERE "deleted" IS NULL;

-- Add index for active events within time range
CREATE INDEX IF NOT EXISTS "idx_event_active_time" 
  ON "public"."hx2-audience_event" ("start", "end") 
  WHERE "deleted" IS NULL;