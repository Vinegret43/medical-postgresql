DROP DATABASE IF EXISTS medical_lfv21;
CREATE DATABASE medical_lfv21;
\c medical_lfv21;

CREATE TABLE pat_lfv21 (
    pat_oms_lfv21 int8 NOT NULL,
    pat_fullname_lfv21 varchar(70) NOT NULL,
    pat_birthdate_lfv21 date NOT NULL,
    pat_phone_lfv21 varchar(15) NOT NULL,
    PRIMARY KEY (pat_oms_lfv21)
);

CREATE TABLE doc_lfv21 (
    doc_license_lfv21 int8 NOT NULL,
    doc_fullname_lfv21 varchar(70) NOT NULL,
    doc_birthdate_lfv21 date NOT NULL,
    doc_phone_lfv21 varchar(15) NOT NULL,
    PRIMARY KEY (doc_license_lfv21)
);

CREATE TABLE admin_lfv21 (
    admin_login_lfv21 varchar(30) NOT NULL,
    admin_fullname_lfv21 varchar(70) NOT NULL,
    admin_birthdate_lfv21 date NOT NULL,
    admin_phone_lfv21 varchar(15) NOT NULL,
    PRIMARY KEY (admin_login_lfv21)
);

CREATE TABLE proc_lfv21 (
    proc_id_lfv21 int8 GENERATED ALWAYS AS IDENTITY NOT NULL,
    pat_oms_lfv21 int8 NOT NULL,
    doc_license_lfv21 int8 NOT NULL,
    proc_time_lfv21 timestamptz NOT NULL,
    proc_name_lfv21 varchar(200) NOT NULL,
    proc_remarks_lfv21 text,
    proc_recommendations_lfv21 text,
    admin_login_lfv21 varchar(30),
    admin_edit_timestamp_lfv21 timestamptz,
    PRIMARY KEY (proc_id_lfv21),
    FOREIGN KEY (pat_oms_lfv21) REFERENCES pat_lfv21(pat_oms_lfv21)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (doc_license_lfv21) REFERENCES doc_lfv21(doc_license_lfv21)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (admin_login_lfv21) REFERENCES admin_lfv21(admin_login_lfv21)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE meds_lfv21 (
    -- Идентификатор вводится вручную (честный знак), не генерируется БД.
    -- Пара (name, method) намеренно не является уникальной.
    proc_meds_id_lfv21 uuid NOT NULL,
    proc_meds_name_lfv21 varchar(50) NOT NULL,
    proc_meds_method_lfv21 varchar(30) NOT NULL,
    PRIMARY KEY (proc_meds_id_lfv21)
);

CREATE TABLE appl_lfv21 (
    proc_id_lfv21 int8 NOT NULL,
    proc_meds_id_lfv21 uuid NOT NULL,
    proc_meds_dosage_lfv21 float8 NOT NULL CHECK (proc_meds_dosage_lfv21 > 0),
    PRIMARY KEY (proc_id_lfv21, proc_meds_id_lfv21),
    FOREIGN KEY (proc_id_lfv21) REFERENCES proc_lfv21(proc_id_lfv21)
        ON DELETE CASCADE ON UPDATE RESTRICT,
    FOREIGN KEY (proc_meds_id_lfv21) REFERENCES meds_lfv21(proc_meds_id_lfv21)
        ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- ============================================================================
--                                 CREATE
-- ============================================================================

CREATE PROCEDURE admin_create_patient(
    IN p_oms int8,
    IN p_fullname varchar(70),
    IN p_birthdate date,
    IN p_phone varchar(15)
)
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO pat_lfv21 (
        pat_oms_lfv21,
        pat_fullname_lfv21,
        pat_birthdate_lfv21,
        pat_phone_lfv21
    ) VALUES (
        p_oms,
        p_fullname,
        p_birthdate,
        p_phone
    );
END;
$$;

CREATE PROCEDURE admin_create_doctor(
    IN p_license int8,
    IN p_fullname varchar(70),
    IN p_birthdate date,
    IN p_phone varchar(15)
)
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO doc_lfv21 (
        doc_license_lfv21,
        doc_fullname_lfv21,
        doc_birthdate_lfv21,
        doc_phone_lfv21
    ) VALUES (
        p_license,
        p_fullname,
        p_birthdate,
        p_phone
    );
END;
$$;

-- time можно передать явно; если не передан — берётся текущее время.
-- p_proc_id возвращает созданный идентификатор, чтобы затем добавить appl.
CREATE PROCEDURE doc_create_proc(
    IN p_oms int8,
    IN p_license int8,
    IN p_name varchar(200),
    IN p_remarks text DEFAULT NULL,
    IN p_recommendations text DEFAULT NULL,
    IN p_time timestamptz DEFAULT NULL,
    INOUT p_proc_id int8 DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO proc_lfv21 (
        pat_oms_lfv21,
        doc_license_lfv21,
        proc_time_lfv21,
        proc_name_lfv21,
        proc_remarks_lfv21,
        proc_recommendations_lfv21
    ) VALUES (
        p_oms,
        p_license,
        COALESCE(p_time, now()),
        p_name,
        p_remarks,
        p_recommendations
    )
    RETURNING proc_id_lfv21 INTO p_proc_id;
END;
$$;

CREATE PROCEDURE admin_create_medication(
    IN p_id uuid,
    IN p_name varchar(50),
    IN p_method varchar(30)
)
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO meds_lfv21 (
        proc_meds_id_lfv21,
        proc_meds_name_lfv21,
        proc_meds_method_lfv21
    ) VALUES (
        p_id,
        p_name,
        p_method
    );
END;
$$;

CREATE PROCEDURE doc_create_appl(
    IN p_proc_id int8,
    IN p_med_id uuid,
    IN p_dosage float8
)
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO appl_lfv21 (
        proc_id_lfv21,
        proc_meds_id_lfv21,
        proc_meds_dosage_lfv21
    ) VALUES (
        p_proc_id,
        p_med_id,
        p_dosage
    );
END;
$$;

-- ============================================================================
--                                 Retrieve
-- ============================================================================
-- One neutral API for every role. There are no DB roles/RLS here, so the same
-- functions serve admin, doctor and patient. When a caller may only see one
-- patient's data, pass p_pat_oms: the ownership check is then done in SQL.

CREATE VIEW v_patients AS
SELECT
    p.pat_oms_lfv21 AS oms,
    p.pat_fullname_lfv21 AS fullname,
    p.pat_birthdate_lfv21 AS birthdate,
    p.pat_phone_lfv21 AS phone
FROM pat_lfv21 AS p;

CREATE VIEW v_doctors AS
SELECT
    d.doc_license_lfv21 AS license,
    d.doc_fullname_lfv21 AS fullname,
    d.doc_birthdate_lfv21 AS birthdate,
    d.doc_phone_lfv21 AS phone
FROM doc_lfv21 AS d;

CREATE VIEW v_admins AS
SELECT
    a.admin_login_lfv21 AS login,
    a.admin_fullname_lfv21 AS fullname,
    a.admin_birthdate_lfv21 AS birthdate,
    a.admin_phone_lfv21 AS phone
FROM admin_lfv21 AS a;

CREATE VIEW v_meds AS
SELECT
    m.proc_meds_id_lfv21 AS id,
    m.proc_meds_name_lfv21 AS name,
    m.proc_meds_method_lfv21 AS method
FROM meds_lfv21 AS m;

-- All procedure columns without joins; functions below add the joins/filters.
CREATE VIEW v_procs AS
SELECT
    pr.proc_id_lfv21 AS proc_id,
    pr.pat_oms_lfv21 AS oms,
    pr.doc_license_lfv21 AS license,
    pr.proc_time_lfv21 AS proc_time,
    pr.proc_name_lfv21 AS proc_name,
    pr.proc_remarks_lfv21 AS remarks,
    pr.proc_recommendations_lfv21 AS recommendations,
    pr.admin_login_lfv21 AS admin_login,
    pr.admin_edit_timestamp_lfv21 AS admin_edit_timestamp
FROM proc_lfv21 AS pr;

CREATE FUNCTION get_patient(p_oms int8)
RETURNS TABLE (
    oms int8,
    fullname varchar(70),
    birthdate date,
    phone varchar(15)
)
LANGUAGE sql STABLE AS $$
    SELECT v.oms, v.fullname, v.birthdate, v.phone
    FROM v_patients AS v
    WHERE v.oms = p_oms;
$$;

CREATE FUNCTION search_patients(p_query varchar)
RETURNS TABLE (
    oms int8,
    fullname varchar(70),
    birthdate date,
    phone varchar(15)
)
LANGUAGE sql STABLE AS $$
    SELECT v.oms, v.fullname, v.birthdate, v.phone
    FROM v_patients AS v
    WHERE COALESCE(p_query, '') = ''
       OR v.oms::text LIKE '%' || p_query || '%'
       OR v.fullname ILIKE '%' || p_query || '%'
    ORDER BY v.fullname, v.oms
    LIMIT 200;
$$;

CREATE FUNCTION get_doctor(p_license int8)
RETURNS TABLE (
    license int8,
    fullname varchar(70),
    birthdate date,
    phone varchar(15)
)
LANGUAGE sql STABLE AS $$
    SELECT v.license, v.fullname, v.birthdate, v.phone
    FROM v_doctors AS v
    WHERE v.license = p_license;
$$;

CREATE FUNCTION get_admin(p_login varchar(30))
RETURNS TABLE (
    login varchar(30),
    fullname varchar(70),
    birthdate date,
    phone varchar(15)
)
LANGUAGE sql STABLE AS $$
    SELECT v.login, v.fullname, v.birthdate, v.phone
    FROM v_admins AS v
    WHERE v.login = p_login;
$$;

CREATE FUNCTION search_doctors(p_query varchar)
RETURNS TABLE (
    license int8,
    fullname varchar(70),
    birthdate date,
    phone varchar(15)
)
LANGUAGE sql STABLE AS $$
    SELECT v.license, v.fullname, v.birthdate, v.phone
    FROM v_doctors AS v
    WHERE COALESCE(p_query, '') = ''
       OR v.license::text LIKE '%' || p_query || '%'
       OR v.fullname ILIKE '%' || p_query || '%'
    ORDER BY v.fullname, v.license
    LIMIT 200;
$$;

CREATE FUNCTION get_medications()
RETURNS TABLE (
    id uuid,
    name varchar(50),
    method varchar(30)
)
LANGUAGE sql STABLE AS $$
    SELECT v.id, v.name, v.method
    FROM v_meds AS v
    ORDER BY v.name, v.method, v.id;
$$;

CREATE FUNCTION get_medication(p_id uuid)
RETURNS TABLE (
    id uuid,
    name varchar(50),
    method varchar(30)
)
LANGUAGE sql STABLE AS $$
    SELECT v.id, v.name, v.method
    FROM v_meds AS v
    WHERE v.id = p_id;
$$;

CREATE FUNCTION get_procedures(
    IN p_pat_oms int8 DEFAULT NULL,
    IN p_doc_license int8 DEFAULT NULL
)
RETURNS TABLE (
    proc_id int8,
    oms int8,
    patient_fullname varchar(70),
    license int8,
    doctor_fullname varchar(70),
    doctor_phone varchar(15),
    proc_time timestamptz,
    proc_name varchar(200),
    remarks text,
    recommendations text,
    admin_login varchar(30),
    admin_edit_timestamp timestamptz
)
LANGUAGE sql STABLE AS $$
    SELECT
        pr.proc_id,
        pr.oms,
        p.fullname AS patient_fullname,
        pr.license,
        d.fullname AS doctor_fullname,
        d.phone AS doctor_phone,
        pr.proc_time,
        pr.proc_name,
        pr.remarks,
        pr.recommendations,
        pr.admin_login,
        pr.admin_edit_timestamp
    FROM v_procs AS pr
    LEFT JOIN v_patients AS p ON p.oms = pr.oms
    LEFT JOIN v_doctors AS d ON d.license = pr.license
    WHERE (p_pat_oms IS NULL OR pr.oms = p_pat_oms)
      AND (p_doc_license IS NULL OR pr.license = p_doc_license);
$$;

CREATE FUNCTION get_procedure(
    IN p_proc_id int8,
    IN p_pat_oms int8 DEFAULT NULL
)
RETURNS TABLE (
    proc_id int8,
    oms int8,
    patient_fullname varchar(70),
    license int8,
    doctor_fullname varchar(70),
    doctor_phone varchar(15),
    proc_time timestamptz,
    proc_name varchar(200),
    remarks text,
    recommendations text,
    admin_login varchar(30),
    admin_edit_timestamp timestamptz
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    -- The one canonical ownership check. Patient routes pass their session OMS.
    IF p_pat_oms IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM proc_lfv21 AS pr
        WHERE pr.proc_id_lfv21 = p_proc_id
          AND pr.pat_oms_lfv21 = p_pat_oms
    ) THEN
        RAISE EXCEPTION 'procedure % is not available for OMS %', p_proc_id, p_pat_oms
            USING ERRCODE = 'P0002';
    END IF;

    RETURN QUERY
    SELECT
        pr.proc_id,
        pr.oms,
        pr.patient_fullname,
        pr.license,
        pr.doctor_fullname,
        pr.doctor_phone,
        pr.proc_time,
        pr.proc_name,
        pr.remarks,
        pr.recommendations,
        pr.admin_login,
        pr.admin_edit_timestamp
    FROM get_procedures() AS pr
    WHERE pr.proc_id = p_proc_id;
END;
$$;

CREATE FUNCTION get_procedure_medications(
    IN p_proc_id int8,
    IN p_pat_oms int8 DEFAULT NULL
)
RETURNS TABLE (
    proc_id int8,
    med_id uuid,
    med_name varchar(50),
    med_method varchar(30),
    dosage float8
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    -- Reuse the ownership check above; no second copy of the P0002 logic.
    IF p_pat_oms IS NOT NULL THEN
        PERFORM 1 FROM get_procedure(p_proc_id, p_pat_oms);
    END IF;

    RETURN QUERY
    SELECT
        pr.proc_id_lfv21 AS proc_id,
        m.id AS med_id,
        m.name AS med_name,
        m.method AS med_method,
        a.proc_meds_dosage_lfv21 AS dosage
    FROM proc_lfv21 AS pr
    JOIN appl_lfv21 AS a ON a.proc_id_lfv21 = pr.proc_id_lfv21
    JOIN v_meds AS m ON m.id = a.proc_meds_id_lfv21
    WHERE pr.proc_id_lfv21 = p_proc_id;
END;
$$;

CREATE FUNCTION count_procedures(
    IN p_pat_oms int8 DEFAULT NULL,
    IN p_doc_license int8 DEFAULT NULL
)
RETURNS int8
LANGUAGE sql STABLE AS $$
    SELECT count(*)::int8
    FROM proc_lfv21 AS pr
    WHERE (p_pat_oms IS NULL OR pr.pat_oms_lfv21 = p_pat_oms)
      AND (p_doc_license IS NULL OR pr.doc_license_lfv21 = p_doc_license);
$$;

-- ============================================================================
--                                  UPDATE
-- ============================================================================

CREATE PROCEDURE admin_update_patient(
    IN p_oms int8,
    IN p_fullname varchar(70) DEFAULT NULL,
    IN p_birthdate date DEFAULT NULL,
    IN p_phone varchar(15) DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE pat_lfv21 AS p
    SET
        pat_fullname_lfv21 = COALESCE(p_fullname, p.pat_fullname_lfv21),
        pat_birthdate_lfv21 = COALESCE(p_birthdate, p.pat_birthdate_lfv21),
        pat_phone_lfv21 = COALESCE(p_phone, p.pat_phone_lfv21)
    WHERE p.pat_oms_lfv21 = p_oms;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'patient with oms % not found', p_oms USING ERRCODE = 'P0002';
    END IF;
END;
$$;

CREATE PROCEDURE admin_update_doctor(
    IN p_license int8,
    IN p_fullname varchar(70) DEFAULT NULL,
    IN p_birthdate date DEFAULT NULL,
    IN p_phone varchar(15) DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE doc_lfv21 AS d
    SET
        doc_fullname_lfv21 = COALESCE(p_fullname, d.doc_fullname_lfv21),
        doc_birthdate_lfv21 = COALESCE(p_birthdate, d.doc_birthdate_lfv21),
        doc_phone_lfv21 = COALESCE(p_phone, d.doc_phone_lfv21)
    WHERE d.doc_license_lfv21 = p_license;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'doctor with license % not found', p_license USING ERRCODE = 'P0002';
    END IF;
END;
$$;

-- Обновление администратора намеренно не делаем: admin создаётся/правится вручную через shell

CREATE PROCEDURE admin_update_proc(
    IN p_proc_id int8,
    IN p_name varchar(200),
    IN p_remarks text,
    IN p_recommendations text,
    IN p_time timestamptz,
    IN p_admin_login varchar(30)
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE proc_lfv21 AS pr
    SET
        proc_name_lfv21 = p_name,
        proc_remarks_lfv21 = p_remarks,
        proc_recommendations_lfv21 = p_recommendations,
        proc_time_lfv21 = p_time,
        admin_login_lfv21 = p_admin_login
    WHERE pr.proc_id_lfv21 = p_proc_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'procedure % not found', p_proc_id USING ERRCODE = 'P0002';
    END IF;
END;
$$;

-- Application edits are not field updates on proc_lfv21, but they still need to
-- be attributed to the signed-in admin. The existing trigger sets the timestamp.
CREATE PROCEDURE admin_touch_proc(
    IN p_proc_id int8,
    IN p_admin_login varchar(30)
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE proc_lfv21 AS pr
    SET admin_login_lfv21 = p_admin_login
    WHERE pr.proc_id_lfv21 = p_proc_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'procedure % not found', p_proc_id USING ERRCODE = 'P0002';
    END IF;
END;
$$;

CREATE PROCEDURE admin_update_med(
    IN p_id uuid,
    IN p_name varchar(50) DEFAULT NULL,
    IN p_method varchar(30) DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE meds_lfv21 AS m
    SET
        proc_meds_name_lfv21 = COALESCE(p_name, m.proc_meds_name_lfv21),
        proc_meds_method_lfv21 = COALESCE(p_method, m.proc_meds_method_lfv21)
    WHERE m.proc_meds_id_lfv21 = p_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'med with id % not found', p_id USING ERRCODE = 'P0002';
    END IF;
END;
$$;

CREATE PROCEDURE admin_update_appl(
    IN p_proc_id int8,
    IN p_med_id uuid,
    IN p_dosage float8
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE appl_lfv21 AS a
    SET proc_meds_dosage_lfv21 = p_dosage
    WHERE a.proc_id_lfv21 = p_proc_id
      AND a.proc_meds_id_lfv21 = p_med_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'application (proc %, med %) not found', p_proc_id, p_med_id
            USING ERRCODE = 'P0002';
    END IF;
END;
$$;

-- ============================================================================
--                                   DELETE
-- ============================================================================

CREATE PROCEDURE admin_delete_patient(IN p_oms int8)
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM pat_lfv21 AS p
    WHERE p.pat_oms_lfv21 = p_oms;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'patient with oms % not found', p_oms USING ERRCODE = 'P0002';
    END IF;
END;
$$;

CREATE PROCEDURE admin_delete_doctor(IN p_license int8)
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM doc_lfv21 AS d
    WHERE d.doc_license_lfv21 = p_license;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'doctor with license % not found', p_license USING ERRCODE = 'P0002';
    END IF;
END;
$$;

CREATE PROCEDURE admin_delete_med(IN p_id uuid)
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM meds_lfv21 AS m
    WHERE m.proc_meds_id_lfv21 = p_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'med with id % not found', p_id USING ERRCODE = 'P0002';
    END IF;
END;
$$;

CREATE PROCEDURE admin_delete_proc(IN p_proc_id int8)
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM proc_lfv21 AS pr
    WHERE pr.proc_id_lfv21 = p_proc_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'procedure % not found', p_proc_id USING ERRCODE = 'P0002';
    END IF;
END;
$$;

CREATE PROCEDURE admin_delete_appl(IN p_proc_id int8, IN p_med_id uuid)
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM appl_lfv21 AS a
    WHERE a.proc_id_lfv21 = p_proc_id
      AND a.proc_meds_id_lfv21 = p_med_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'application (proc %, med %) not found', p_proc_id, p_med_id
            USING ERRCODE = 'P0002';
    END IF;
END;
$$;

-- ============================================================================
--                                 Триггеры
-- ============================================================================

CREATE FUNCTION set_proc_edit_timestamp()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.admin_edit_timestamp_lfv21 := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER proc_edit_timestamp
BEFORE UPDATE ON proc_lfv21
FOR EACH ROW
EXECUTE FUNCTION set_proc_edit_timestamp();

CREATE FUNCTION validate_phone()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_phone text;
BEGIN
    v_phone := to_jsonb(NEW) ->> TG_ARGV[0];

    -- Канонический формат: +7 и ровно 10 цифр, например +79991234567.
    IF v_phone IS NULL OR v_phone !~ '^\+7[0-9]{10}$' THEN
        RAISE EXCEPTION 'invalid phone format: %. Expected +7XXXXXXXXXX', v_phone
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER pat_phone_check
BEFORE INSERT OR UPDATE ON pat_lfv21
FOR EACH ROW
EXECUTE FUNCTION validate_phone('pat_phone_lfv21');

CREATE TRIGGER doc_phone_check
BEFORE INSERT OR UPDATE ON doc_lfv21
FOR EACH ROW
EXECUTE FUNCTION validate_phone('doc_phone_lfv21');

CREATE TRIGGER admin_phone_check
BEFORE INSERT OR UPDATE ON admin_lfv21
FOR EACH ROW
EXECUTE FUNCTION validate_phone('admin_phone_lfv21');

-- ============================================================================
-- Индексы. PostgreSQL не индексирует FK автоматически. PK appl(proc_id, med_id)
-- уже покрывает поиск по proc_id, отдельный индекс по нему не нужен.
-- ============================================================================

-- TODO: посмотреть, какие из этих индексов вообще будут использованы выше написанным кодом

CREATE INDEX idx_proc_pat_oms ON proc_lfv21 (pat_oms_lfv21);
CREATE INDEX idx_proc_doc_license ON proc_lfv21 (doc_license_lfv21);
CREATE INDEX idx_proc_admin_login ON proc_lfv21 (admin_login_lfv21);
CREATE INDEX idx_proc_time ON proc_lfv21 (proc_time_lfv21);
CREATE INDEX idx_appl_med ON appl_lfv21 (proc_meds_id_lfv21);
