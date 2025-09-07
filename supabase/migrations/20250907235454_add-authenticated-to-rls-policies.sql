-- Add TO authenticated clauses to existing RLS policies
-- This ensures policies are only applied to authenticated users

-- Drop existing policies
DROP POLICY IF EXISTS "event_creator_full_access" ON "public"."hx2-audience_event";
DROP POLICY IF EXISTS "activity_creator_full_access" ON "public"."hx2-audience_activity";
DROP POLICY IF EXISTS "question_submitter_access" ON "public"."hx2-audience_question";
DROP POLICY IF EXISTS "question_creator_access" ON "public"."hx2-audience_question";
DROP POLICY IF EXISTS "activity_response_user_access" ON "public"."hx2-audience_activity_response";
DROP POLICY IF EXISTS "activity_response_creator_read" ON "public"."hx2-audience_activity_response";
DROP POLICY IF EXISTS "presenter_state_creator_access" ON "public"."hx2-audience_presenter_state";

-- Recreate policies with TO authenticated clauses

-- Event creators can view, create, update, and delete their own events
CREATE POLICY "event_creator_full_access" ON "public"."hx2-audience_event"
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()::uuid) = "creatorId");

-- Event creators can manage activities for their events
CREATE POLICY "activity_creator_full_access" ON "public"."hx2-audience_activity"
  FOR ALL
  TO authenticated
  USING (
    (SELECT auth.uid()::uuid) IN (
      SELECT "creatorId" 
      FROM "public"."hx2-audience_event" 
      WHERE "id" = "eventId"
    )
  );

-- Question submitters can view and update their own questions
CREATE POLICY "question_submitter_access" ON "public"."hx2-audience_question"
  FOR ALL
  TO authenticated
  USING (
    (SELECT auth.uid()::uuid) = "submitterUserId" AND "deleted" IS NULL
  );

-- Event creators can view and manage all questions for their events
CREATE POLICY "question_creator_access" ON "public"."hx2-audience_question"
  FOR ALL
  TO authenticated
  USING (
    (SELECT auth.uid()::uuid) IN (
      SELECT "creatorId" 
      FROM "public"."hx2-audience_event" 
      WHERE "id" = "eventId"
    )
  );

-- Users can manage their own activity responses
CREATE POLICY "activity_response_user_access" ON "public"."hx2-audience_activity_response"
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()::uuid) = "userId");

-- Event creators can view responses to activities in their events
CREATE POLICY "activity_response_creator_read" ON "public"."hx2-audience_activity_response"
  FOR SELECT
  TO authenticated
  USING (
    "activityId" IN (
      SELECT a."id"
      FROM "public"."hx2-audience_activity" a
      JOIN "public"."hx2-audience_event" e ON a."eventId" = e."id"
      WHERE e."creatorId" = (SELECT auth.uid()::uuid)
    )
  );

-- Event creators can manage presenter state for their events
CREATE POLICY "presenter_state_creator_access" ON "public"."hx2-audience_presenter_state"
  FOR ALL
  TO authenticated
  USING (
    (SELECT auth.uid()::uuid) IN (
      SELECT "creatorId" 
      FROM "public"."hx2-audience_event" 
      WHERE "id" = "eventId"
    )
  );