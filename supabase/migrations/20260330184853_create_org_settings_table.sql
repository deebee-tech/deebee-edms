CREATE TABLE IF NOT EXISTS deebee_edms.organization_settings
(
    id serial NOT NULL,
    organization_id integer NOT NULL,
    settings_key character varying(200) NOT NULL,
    settings_value text NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT organization_settings_unique_setting UNIQUE (organization_id, settings_key),
    CONSTRAINT organization_settings_organizations FOREIGN KEY (organization_id)
      REFERENCES deebee_edms.organizations (id)
);