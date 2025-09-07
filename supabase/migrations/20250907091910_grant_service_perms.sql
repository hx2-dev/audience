-- Grant service role permissions for database operations
-- This allows the service role to perform CRUD operations on all tables

-- Grant usage on public schema
GRANT USAGE ON SCHEMA "public" TO "service_role";

-- Grant all privileges on all tables in public schema
GRANT ALL ON ALL TABLES IN SCHEMA "public" TO "service_role";

-- Grant all privileges on all sequences in public schema (for auto-increment columns)
GRANT ALL ON ALL SEQUENCES IN SCHEMA "public" TO "service_role";

-- Grant all privileges on all functions in public schema
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "public" TO "service_role";