GRANT USAGE ON SCHEMA deebee_edms TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA deebee_edms TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA deebee_edms TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA deebee_edms TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA deebee_edms GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA deebee_edms GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA deebee_edms GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;