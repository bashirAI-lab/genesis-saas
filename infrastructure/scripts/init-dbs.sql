-- Auto-create demo tenant databases during first startup
-- This script runs only once when the PostgreSQL container is first created.

-- Main database (already created via POSTGRES_DB env var)
-- CREATE DATABASE saas_main;

-- Demo tenant databases
CREATE DATABASE saas_tenant_acme;
CREATE DATABASE saas_tenant_globex;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE saas_tenant_acme TO postgres;
GRANT ALL PRIVILEGES ON DATABASE saas_tenant_globex TO postgres;
