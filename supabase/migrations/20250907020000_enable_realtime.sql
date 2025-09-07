-- Enable Supabase Realtime for presenter state and questions tables

-- Enable realtime for presenter state (for live presentation updates)
ALTER PUBLICATION supabase_realtime ADD TABLE "public"."hx2-audience_presenter_state";

-- Enable realtime for questions (for live Q&A updates)  
ALTER PUBLICATION supabase_realtime ADD TABLE "public"."hx2-audience_question";