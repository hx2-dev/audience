-- Enable Row Level Security (RLS) on all tables
ALTER TABLE "public"."hx2-audience_event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."hx2-audience_activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."hx2-audience_question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."hx2-audience_activity_response" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."hx2-audience_presenter_state" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS (Optional - for more complex policies)
-- =====================================================

-- Function to check if user can access an event
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
      e."creatorId" = auth.uid()::uuid OR 
      (e."shortId" IS NOT NULL AND e."deleted" IS NULL)
    )
  );
$$;

-- Function to check if user is event creator
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
    AND e."creatorId" = auth.uid()::uuid
  );
$$;

-- Function to check if an event is publicly accessible (has shortId and is active)
CREATE OR REPLACE FUNCTION public.event_is_publicly_accessible(event_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY definer
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM "hx2-audience_event" e
    WHERE e."id" = event_id 
    AND e."shortId" IS NOT NULL 
    AND e."deleted" IS NULL
    AND CURRENT_TIMESTAMP BETWEEN e."start" AND e."end"
  );
$$;
-- =====================================================
-- EVENTS: Only creators can manage their own events
-- =====================================================

-- Event creators can view, create, update, and delete their own events
CREATE POLICY "event_creator_full_access" ON "public"."hx2-audience_event"
  FOR ALL
  USING (auth.uid()::uuid = "creatorId");

-- Public can view events by shortId (for joining events)
CREATE POLICY "event_public_read_by_short_id" ON "public"."hx2-audience_event"
  FOR SELECT
  USING (
    "shortId" IS NOT NULL AND 
    "deleted" IS NULL AND
    CURRENT_TIMESTAMP BETWEEN "start" AND "end"
  );

-- =====================================================
-- ACTIVITIES: Event creators manage, public can read current activities
-- =====================================================

-- Event creators can manage activities for their events
CREATE POLICY "activity_creator_full_access" ON "public"."hx2-audience_activity"
  FOR ALL
  USING (
    auth.uid()::uuid IN (
      SELECT "creatorId" 
      FROM "public"."hx2-audience_event" 
      WHERE "id" = "eventId"
    )
  );

-- Public can read activities for events they have access to
CREATE POLICY "activity_public_read" ON "public"."hx2-audience_activity"
  FOR SELECT
  USING (
    "deleted" IS NULL AND
    "eventId" IN (
      SELECT "id" 
      FROM "public"."hx2-audience_event" 
      WHERE "shortId" IS NOT NULL AND "deleted" IS NULL
    )
  );

-- =====================================================
-- QUESTIONS: Submitters and event creators can access
-- =====================================================

-- Question submitters can view and update their own questions
CREATE POLICY "question_submitter_access" ON "public"."hx2-audience_question"
  FOR ALL
  USING (
    auth.uid()::uuid = "submitterUserId" AND "deleted" IS NULL
  );

-- Event creators can view and manage all questions for their events
CREATE POLICY "question_creator_access" ON "public"."hx2-audience_question"
  FOR ALL
  USING (
    auth.uid()::uuid IN (
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
    auth.uid()::uuid IS NOT NULL AND
    "eventId" IN (
      SELECT "id" 
      FROM "public"."hx2-audience_event" 
      WHERE "shortId" IS NOT NULL AND "deleted" IS NULL
    )
  );

-- Public can read questions for active events with shortId
CREATE POLICY "question_public_read_active_events" ON "public"."hx2-audience_question"
  FOR SELECT
  USING (
    "deleted" IS NULL AND
    public.event_is_publicly_accessible("eventId")
  );

-- =====================================================
-- ACTIVITY RESPONSES: Users own their responses
-- =====================================================

-- Users can manage their own activity responses
CREATE POLICY "activity_response_user_access" ON "public"."hx2-audience_activity_response"
  FOR ALL
  USING (auth.uid()::uuid = "userId");

-- Event creators can view responses to activities in their events
CREATE POLICY "activity_response_creator_read" ON "public"."hx2-audience_activity_response"
  FOR SELECT
  USING (
    "activityId" IN (
      SELECT a."id"
      FROM "public"."hx2-audience_activity" a
      JOIN "public"."hx2-audience_event" e ON a."eventId" = e."id"
      WHERE e."creatorId" = auth.uid()::uuid
    )
  );

-- =====================================================
-- PRESENTER STATE: Only event creators can manage
-- =====================================================

-- Event creators can manage presenter state for their events
CREATE POLICY "presenter_state_creator_access" ON "public"."hx2-audience_presenter_state"
  FOR ALL
  USING (
    auth.uid()::uuid IN (
      SELECT "creatorId" 
      FROM "public"."hx2-audience_event" 
      WHERE "id" = "eventId"
    )
  );

-- Public can read presenter state for events they have access to
CREATE POLICY "presenter_state_public_read" ON "public"."hx2-audience_presenter_state"
  FOR SELECT
  USING (
    "eventId" IN (
      SELECT "id" 
      FROM "public"."hx2-audience_event" 
      WHERE "shortId" IS NOT NULL AND "deleted" IS NULL
    )
  );


-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON "public"."hx2-audience_question" TO authenticated;
GRANT INSERT ON "public"."hx2-audience_activity_response" TO authenticated;