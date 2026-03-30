INSERT INTO deebee_edms.dual (dummy)
VALUES ('X')
ON CONFLICT (dummy) DO NOTHING;