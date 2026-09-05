-- Bootstrap seed: creates the one department and one ADMINISTRATOR account
-- needed to log in for the first time. Run once, after schema.sql and
-- seed.sql (which seeds the 10 fixed roles).
--
-- The password below is a placeholder. Log in with it once, then
-- immediately change it (or create your own admin user and delete this
-- one) — do not leave this account or password in a real deployment.
--
-- Login email:    admin@campus.edu
-- Login password: ChangeMe123!

INSERT INTO departments (name, code) VALUES ('Computer Science and Engineering', 'CSE');
SET @dept_id = (SELECT id FROM departments WHERE code = 'CSE');

SET @pw = '$2b$10$/BEW0b27jvh/nYpRPLZ45eNU4jSyJzytYEwffN/OcEaGljWtoLOOO'; -- ChangeMe123!

INSERT INTO users (full_name, email, password_hash, role_id, rfid_card_id)
VALUES ('System Administrator', 'admin@campus.edu', @pw, (SELECT id FROM roles WHERE name = 'ADMINISTRATOR'), NULL);
INSERT INTO administrator_profiles (user_id, employee_id)
VALUES (LAST_INSERT_ID(), 'EMP-ADMIN-001');

-- Once logged in as this account, use the Users module to create the real
-- students, faculty, and other staff accounts for your campus, each with
-- their own password.
