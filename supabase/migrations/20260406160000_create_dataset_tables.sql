-- Database connections: stores external database connection configurations
CREATE TABLE IF NOT EXISTS deebee_edms.db_connections
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    engine character varying(20) NOT NULL DEFAULT 'postgres',
    connection_config jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT db_connections_organizations FOREIGN KEY (organization_id)
      REFERENCES deebee_edms.organizations (id),
    CONSTRAINT db_connections_engine_check CHECK (engine IN ('postgres', 'mysql', 'mssql', 'sqlite'))
);

CREATE INDEX idx_db_connections_org_id ON deebee_edms.db_connections (organization_id);

-- Cached schema introspection for a connection
CREATE TABLE IF NOT EXISTS deebee_edms.db_connection_schemas
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    db_connection_id uuid NOT NULL,
    schema_data jsonb NOT NULL DEFAULT '[]'::jsonb,
    introspected_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT db_connection_schemas_connection FOREIGN KEY (db_connection_id)
      REFERENCES deebee_edms.db_connections (id) ON DELETE CASCADE
);

CREATE INDEX idx_db_connection_schemas_conn_id ON deebee_edms.db_connection_schemas (db_connection_id);

-- Datasets: stores visual query definitions as JSONB
CREATE TABLE IF NOT EXISTS deebee_edms.datasets
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id integer NOT NULL,
    db_connection_id uuid,
    name character varying(255) NOT NULL,
    description text,
    definition jsonb NOT NULL DEFAULT '{}'::jsonb,
    version integer NOT NULL DEFAULT 1,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT datasets_organizations FOREIGN KEY (organization_id)
      REFERENCES deebee_edms.organizations (id),
    CONSTRAINT datasets_db_connection FOREIGN KEY (db_connection_id)
      REFERENCES deebee_edms.db_connections (id) ON DELETE SET NULL
);

CREATE INDEX idx_datasets_org_id ON deebee_edms.datasets (organization_id);
CREATE INDEX idx_datasets_connection_id ON deebee_edms.datasets (db_connection_id);
CREATE INDEX idx_datasets_active ON deebee_edms.datasets (organization_id, is_active);
