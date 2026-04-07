-- Workflows table: stores workflow definitions as JSONB
CREATE TABLE IF NOT EXISTS deebee_edms.workflows
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    definition jsonb NOT NULL DEFAULT '{}'::jsonb,
    version integer NOT NULL DEFAULT 1,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT workflows_organizations FOREIGN KEY (organization_id)
      REFERENCES deebee_edms.organizations (id)
);

CREATE INDEX idx_workflows_org_id ON deebee_edms.workflows (organization_id);
CREATE INDEX idx_workflows_active ON deebee_edms.workflows (organization_id, is_active);

-- Workflow runs: tracks each execution of a workflow
CREATE TABLE IF NOT EXISTS deebee_edms.workflow_runs
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    workflow_id uuid NOT NULL,
    status character varying(20) NOT NULL DEFAULT 'pending',
    global_state jsonb NOT NULL DEFAULT '{}'::jsonb,
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    error text,
    PRIMARY KEY (id),
    CONSTRAINT workflow_runs_workflows FOREIGN KEY (workflow_id)
      REFERENCES deebee_edms.workflows (id) ON DELETE CASCADE,
    CONSTRAINT workflow_runs_status_check CHECK (status IN ('pending', 'running', 'completed', 'failed'))
);

CREATE INDEX idx_workflow_runs_workflow_id ON deebee_edms.workflow_runs (workflow_id);
CREATE INDEX idx_workflow_runs_status ON deebee_edms.workflow_runs (workflow_id, status);

-- Workflow run steps: tracks each node execution within a run
CREATE TABLE IF NOT EXISTS deebee_edms.workflow_run_steps
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    run_id uuid NOT NULL,
    node_id character varying(100) NOT NULL,
    node_type character varying(50) NOT NULL,
    status character varying(20) NOT NULL DEFAULT 'pending',
    input jsonb,
    output jsonb,
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    error text,
    PRIMARY KEY (id),
    CONSTRAINT workflow_run_steps_runs FOREIGN KEY (run_id)
      REFERENCES deebee_edms.workflow_runs (id) ON DELETE CASCADE,
    CONSTRAINT workflow_run_steps_status_check CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped'))
);

CREATE INDEX idx_workflow_run_steps_run_id ON deebee_edms.workflow_run_steps (run_id);
