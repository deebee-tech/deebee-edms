CREATE TABLE IF NOT EXISTS deebee_edms.organizations
(
    id serial NOT NULL,
    organization_identifier character varying(100) NOT NULL,
    PRIMARY KEY (id)
);