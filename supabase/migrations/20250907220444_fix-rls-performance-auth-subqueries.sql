-- Fix RLS performance issues by replacing auth.uid() with subqueries
-- This prevents re-evaluation of auth functions for each row

-- Drop existing policies that use direct auth.uid() calls
DROP POLICY IF EXISTS "event_creator_full_access" ON "public"."hx2-audience_event";
DROP POLICY IF EXISTS "activity_creator_full_access" ON "public"."hx2-audience_activity";
DROP POLICY IF EXISTS "question_submitter_access" ON "public"."hx2-audience_question";
DROP POLICY IF EXISTS "question_creator_access" ON "public"."hx2-audience_question";
DROP POLICY IF EXISTS "question_authenticated_create" ON "public"."hx2-audience_question";
DROP POLICY IF EXISTS "activity_response_user_access" ON "public"."hx2-audience_activity_response";
DROP POLICY IF EXISTS "activity_response_creator_read" ON "public"."hx2-audience_activity_response";
DROP POLICY IF EXISTS "presenter_state_creator_access" ON "public"."hx2-audience_presenter_state";

-- Recreate policies with optimized auth.uid() subqueries

-- =====================================================
-- EVENTS: Only creators can manage their own events
-- =====================================================

-- Event creators can view, create, update, and delete their own events
CREATE POLICY "event_creator_full_access" ON "public"."hx2-audience_event"
  FOR ALL
  USING ((SELECT auth.uid()::uuid) = "creatorId");

-- =====================================================
-- ACTIVITIES: Event creators manage, public can read current activities
-- =====================================================

-- Event creators can manage activities for their events
CREATE POLICY "activity_creator_full_access" ON "public"."hx2-audience_activity"
  FOR ALL
  USING (
    (SELECT auth.uid()::uuid) IN (
      SELECT "creatorId" 
      FROM "public"."hx2-audience_event" 
      WHERE "id" = "eventId"
    )
  );

-- =====================================================
-- QUESTIONS: Submitters and event creators can access
-- =====================================================

-- Question submitters can view and update their own questions
CREATE POLICY "question_submitter_access" ON "public"."hx2-audience_question"
  FOR ALL
  USING (
    (SELECT auth.uid()::uuid) = "submitterUserId" AND "deleted" IS NULL
  );

-- Event creators can view and manage all questions for their events
CREATE POLICY "question_creator_access" ON "public"."hx2-audience_question"
  FOR ALL
  USING (
    (SELECT auth.uid()::uuid) IN (
      SELECT "creatorId" 
      FROM "public"."hx2-audience_event" 
      WHERE "id" = "eventId"
    )
  );

-- Authenticated users can create questions for public events
CREATE POLICY "question_authenticated_create" ON "public"."hx2-audience_question"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()::uuid) IS NOT NULL AND
    "eventId" IN (
      SELECT "id" 
      FROM "public"."hx2-audience_event" 
      WHERE "shortId" IS NOT NULL AND "deleted" IS NULL
    )
  );

-- =====================================================
-- ACTIVITY RESPONSES: Users own their responses
-- =====================================================

-- Users can manage their own activity responses
CREATE POLICY "activity_response_user_access" ON "public"."hx2-audience_activity_response"
  FOR ALL
  USING ((SELECT auth.uid()::uuid) = "userId");

-- Event creators can view responses to activities in their events
CREATE POLICY "activity_response_creator_read" ON "public"."hx2-audience_activity_response"
  FOR SELECT
  USING (
    "activityId" IN (
      SELECT a."id"
      FROM "public"."hx2-audience_activity" a
      JOIN "public"."hx2-audience_event" e ON a."eventId" = e."id"
      WHERE e."creatorId" = (SELECT auth.uid()::uuid)
    )
  );

-- =====================================================
-- PRESENTER STATE: Only event creators can manage
-- =====================================================

-- Event creators can manage presenter state for their events
CREATE POLICY "presenter_state_creator_access" ON "public"."hx2-audience_presenter_state"
  FOR ALL
  USING (
    (SELECT auth.uid()::uuid) IN (
      SELECT "creatorId" 
      FROM "public"."hx2-audience_event" 
      WHERE "id" = "eventId"
    )
  );

-- Update helper functions to also use subqueries for consistency
CREATE OR REPLACE FUNCTION public.user_can_access_event(event_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY definer
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM "hx2-audience_event" e
    WHERE e."id" = event_id 
    AND (
      e."creatorId" = (SELECT auth.uid()::uuid) OR 
      (e."shortId" IS NOT NULL AND e."deleted" IS NULL)
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_event_creator(event_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY definer
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM "hx2-audience_event" e
    WHERE e."id" = event_id 
    AND e."creatorId" = (SELECT auth.uid()::uuid)
  );
$$;