-- Authentication tables for the medical services app.
-- Run after create_db.sql:
--     psql -U postgres -f create_auth.sql
--
-- Demo credentials:
--     admin   / admin123                        (scrypt hash stored below)
--     doctor  / 1000000001 + TOTP JBSWY3DPEHPK3PXP
--     patient / 2000000001 + TOTP GEZDGNBVGY3TQOJQ
-- Print a current TOTP code with:
--     node app/scripts/auth-tools.mjs totp JBSWY3DPEHPK3PXP

\c medical_lfv21;

DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS auth_users;

CREATE TABLE auth_users (
    id uuid PRIMARY KEY,
    role varchar(20) NOT NULL CHECK (role IN ('admin', 'doctor', 'patient')),
    subject_id varchar(30) NOT NULL,
    credential text NOT NULL,
    UNIQUE (role, subject_id)
);

-- Deliberately minimal: a token maps to a user, nothing else.
CREATE TABLE sessions (
    token varchar(64) PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE
);


-- auth_users.subject_id cannot be a foreign key: it points at one of three
-- different tables depending on the role. Triggers keep it consistent instead.
CREATE OR REPLACE FUNCTION auth_subject_on_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM auth_users
    WHERE role = TG_ARGV[0]
      AND subject_id = (to_jsonb(OLD) ->> TG_ARGV[1]);
    RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION auth_subject_on_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    UPDATE auth_users
    SET subject_id = (to_jsonb(NEW) ->> TG_ARGV[1])
    WHERE role = TG_ARGV[0]
      AND subject_id = (to_jsonb(OLD) ->> TG_ARGV[1]);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pat_auth_delete ON pat_lfv21;
DROP TRIGGER IF EXISTS pat_auth_update ON pat_lfv21;
CREATE TRIGGER pat_auth_delete BEFORE DELETE ON pat_lfv21
    FOR EACH ROW EXECUTE FUNCTION auth_subject_on_delete('patient', 'pat_oms_lfv21');
CREATE TRIGGER pat_auth_update AFTER UPDATE ON pat_lfv21
    FOR EACH ROW EXECUTE FUNCTION auth_subject_on_update('patient', 'pat_oms_lfv21');

DROP TRIGGER IF EXISTS doc_auth_delete ON doc_lfv21;
DROP TRIGGER IF EXISTS doc_auth_update ON doc_lfv21;
CREATE TRIGGER doc_auth_delete BEFORE DELETE ON doc_lfv21
    FOR EACH ROW EXECUTE FUNCTION auth_subject_on_delete('doctor', 'doc_license_lfv21');
CREATE TRIGGER doc_auth_update AFTER UPDATE ON doc_lfv21
    FOR EACH ROW EXECUTE FUNCTION auth_subject_on_update('doctor', 'doc_license_lfv21');

DROP TRIGGER IF EXISTS admin_auth_delete ON admin_lfv21;
DROP TRIGGER IF EXISTS admin_auth_update ON admin_lfv21;
CREATE TRIGGER admin_auth_delete BEFORE DELETE ON admin_lfv21
    FOR EACH ROW EXECUTE FUNCTION auth_subject_on_delete('admin', 'admin_login_lfv21');
CREATE TRIGGER admin_auth_update AFTER UPDATE ON admin_lfv21
    FOR EACH ROW EXECUTE FUNCTION auth_subject_on_update('admin', 'admin_login_lfv21');
