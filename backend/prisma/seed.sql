-- Seed the 10 fixed roles from the spec.
-- Run once after schema.sql, before creating any users.
INSERT INTO roles (name, description) VALUES
  ('STUDENT',       'Student'),
  ('FACULTY',       'Faculty member'),
  ('HOD',           'Head of Department'),
  ('DEAN',          'Dean'),
  ('ADMINISTRATOR', 'System administrator'),
  ('OFFICE_STAFF',  'Office staff'),
  ('LAB_ASSISTANT', 'Lab assistant'),
  ('SECURITY',      'Security staff'),
  ('HOUSEKEEPING',  'Housekeeping staff'),
  ('MAINTENANCE',   'Maintenance staff');
