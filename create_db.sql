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

-- Для пациентов ---------------------------------------------------------------

CREATE FUNCTION pat_get_patient(p_oms int8)
RETURNS TABLE (
    oms int8,
    fullname varchar(70),
    birthdate date,
    phone varchar(15)
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.pat_oms_lfv21 AS oms,
        p.pat_fullname_lfv21 AS fullname,
        p.pat_birthdate_lfv21 AS birthdate,
        p.pat_phone_lfv21 AS phone
    FROM pat_lfv21 AS p
    WHERE p.pat_oms_lfv21 = p_oms;
END;
$$;

CREATE FUNCTION pat_get_procedures(p_oms int8)
RETURNS TABLE (
    proc_id int8,
    oms int8,
    doc_fullname varchar(70),
    doc_phone varchar(15),
    proc_time timestamptz,
    proc_name varchar(200),
    recommendations text
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    SELECT
        pr.proc_id_lfv21 AS proc_id,
        pr.pat_oms_lfv21 AS oms,
        d.doc_fullname_lfv21 AS doc_fullname,
        d.doc_phone_lfv21 AS doc_phone,
        pr.proc_time_lfv21 AS proc_time,
        pr.proc_name_lfv21 AS proc_name,
        pr.proc_recommendations_lfv21 AS recommendations
    FROM proc_lfv21 AS pr
    JOIN doc_lfv21 AS d ON d.doc_license_lfv21 = pr.doc_license_lfv21
    WHERE pr.pat_oms_lfv21 = p_oms;
END;
$$;

CREATE FUNCTION pat_get_proc_meds(p_proc_id int8, p_oms int8)
RETURNS TABLE (
    proc_id int8,
    med_id uuid,
    med_name varchar(50),
    med_method varchar(30),
    dosage float8
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    -- Если процедура не принадлежит переданному ОМС — ошибка.
    IF NOT EXISTS (
        SELECT 1
        FROM proc_lfv21 AS pr
        WHERE pr.proc_id_lfv21 = p_proc_id
          AND pr.pat_oms_lfv21 = p_oms
    ) THEN
        RAISE EXCEPTION 'procedure % is not available for OMS %', p_proc_id, p_oms
            USING ERRCODE = 'P0002';
    END IF;

    RETURN QUERY
    SELECT
        pr.proc_id_lfv21 AS proc_id,
        m.proc_meds_id_lfv21 AS med_id,
        m.proc_meds_name_lfv21 AS med_name,
        m.proc_meds_method_lfv21 AS med_method,
        a.proc_meds_dosage_lfv21 AS dosage
    FROM proc_lfv21 AS pr
    JOIN appl_lfv21 AS a ON a.proc_id_lfv21 = pr.proc_id_lfv21
    JOIN meds_lfv21 AS m ON m.proc_meds_id_lfv21 = a.proc_meds_id_lfv21
    WHERE pr.proc_id_lfv21 = p_proc_id;
END;
$$;

CREATE FUNCTION pat_count_procs(p_oms int8)
RETURNS int8
LANGUAGE sql STABLE AS $$
    SELECT count(*)::int8
    FROM proc_lfv21
    WHERE pat_oms_lfv21 = p_oms;
$$;

-- Для докторов ---------------------------------------------------------------

CREATE VIEW v_all_procs AS
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

CREATE VIEW v_all_patients AS
SELECT
    p.pat_oms_lfv21 AS oms,
    p.pat_fullname_lfv21 AS fullname,
    p.pat_birthdate_lfv21 AS birthdate,
    p.pat_phone_lfv21 AS phone
FROM pat_lfv21 AS p;

CREATE VIEW v_all_meds AS
SELECT
    m.proc_meds_id_lfv21 AS id,
    m.proc_meds_name_lfv21 AS name,
    m.proc_meds_method_lfv21 AS method
FROM meds_lfv21 AS m;

CREATE FUNCTION doc_get_patient_procs(p_oms int8)
RETURNS TABLE (
    proc_id int8,
    oms int8,
    license int8,
    doc_fullname varchar(70),
    doc_birthdate date,
    doc_phone varchar(15),
    proc_time timestamptz,
    proc_name varchar(200),
    remarks text,
    recommendations text,
    admin_login varchar(30),
    admin_edit_timestamp timestamptz
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    -- Проверки ОМС здесь нет: это функция для доктора.
    RETURN QUERY
    SELECT
        pr.proc_id_lfv21 AS proc_id,
        pr.pat_oms_lfv21 AS oms,
        d.doc_license_lfv21 AS license,
        d.doc_fullname_lfv21 AS doc_fullname,
        d.doc_birthdate_lfv21 AS doc_birthdate,
        d.doc_phone_lfv21 AS doc_phone,
        pr.proc_time_lfv21 AS proc_time,
        pr.proc_name_lfv21 AS proc_name,
        pr.proc_remarks_lfv21 AS remarks,
        pr.proc_recommendations_lfv21 AS recommendations,
        pr.admin_login_lfv21 AS admin_login,
        pr.admin_edit_timestamp_lfv21 AS admin_edit_timestamp
    FROM proc_lfv21 AS pr
    JOIN doc_lfv21 AS d ON d.doc_license_lfv21 = pr.doc_license_lfv21
    WHERE pr.pat_oms_lfv21 = p_oms;
END;
$$;

CREATE FUNCTION doc_get_proc_details(p_proc_id int8)
RETURNS TABLE (
    proc_id int8,
    oms int8,
    license int8,
    proc_time timestamptz,
    proc_name varchar(200),
    remarks text,
    recommendations text,
    admin_login varchar(30),
    admin_edit_timestamp timestamptz,
    med_id uuid,
    med_name varchar(50),
    med_method varchar(30),
    dosage float8
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    SELECT
        pr.proc_id_lfv21 AS proc_id,
        pr.pat_oms_lfv21 AS oms,
        pr.doc_license_lfv21 AS license,
        pr.proc_time_lfv21 AS proc_time,
        pr.proc_name_lfv21 AS proc_name,
        pr.proc_remarks_lfv21 AS remarks,
        pr.proc_recommendations_lfv21 AS recommendations,
        pr.admin_login_lfv21 AS admin_login,
        pr.admin_edit_timestamp_lfv21 AS admin_edit_timestamp,
        m.proc_meds_id_lfv21 AS med_id,
        m.proc_meds_name_lfv21 AS med_name,
        m.proc_meds_method_lfv21 AS med_method,
        a.proc_meds_dosage_lfv21 AS dosage
    FROM proc_lfv21 AS pr
    JOIN appl_lfv21 AS a ON a.proc_id_lfv21 = pr.proc_id_lfv21
    JOIN meds_lfv21 AS m ON m.proc_meds_id_lfv21 = a.proc_meds_id_lfv21
    WHERE pr.proc_id_lfv21 = p_proc_id;
END;
$$;

CREATE FUNCTION doc_get_doctor_procs(p_license int8)
RETURNS TABLE (
    proc_id int8,
    oms int8,
    license int8,
    proc_time timestamptz,
    proc_name varchar(200),
    remarks text,
    recommendations text,
    admin_login varchar(30),
    admin_edit_timestamp timestamptz
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
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
    FROM proc_lfv21 AS pr
    WHERE pr.doc_license_lfv21 = p_license;
END;
$$;

CREATE FUNCTION doc_count_procs(p_license int8)
RETURNS int8
LANGUAGE sql STABLE AS $$
    SELECT count(*)::int8
    FROM proc_lfv21
    WHERE doc_license_lfv21 = p_license;
$$;

-- Для администратора ---------------------------------------------------------

CREATE VIEW v_all_doctors AS
SELECT
    d.doc_license_lfv21 AS license,
    d.doc_fullname_lfv21 AS fullname,
    d.doc_birthdate_lfv21 AS birthdate,
    d.doc_phone_lfv21 AS phone
FROM doc_lfv21 AS d;

-- Остальные выборки доступны администратору через те же VIEW/функции.

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
    IN p_admin_login varchar(30)
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE proc_lfv21 AS pr
    SET
        proc_name_lfv21 = p_name,
        proc_remarks_lfv21 = p_remarks,
        proc_recommendations_lfv21 = p_recommendations,
        admin_login_lfv21 = p_admin_login
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

-- ============================================================================
--                              Demo data
-- ============================================================================
-- Matches the demo users in create_auth.sql:
--   patient OMS 2000000001, doctor license 1000000001.
-- Created only through the procedures above; no direct DML on base tables.
-- The third procedure intentionally has no medications to exercise the empty state.

DO $$
DECLARE
    v_proc_id int8;
BEGIN
    CALL admin_create_patient(2000000001, 'Ivan Ivanov', DATE '1990-05-14', '+79991234567');
    CALL admin_create_doctor(1000000001, 'Maria Petrova', DATE '1984-03-12', '+79997654321');

    CALL admin_create_medication('9f1b8c2e-5d6a-4f0b-9a3c-1d2e3f4a5b61'::uuid, 'Paracetamol', 'oral');
    CALL admin_create_medication('3c7d9e1a-2b4f-4c8d-8e6a-7f9b0c1d2e34'::uuid, 'Ibuprofen', 'oral');
    CALL admin_create_medication('a4b5c6d7-8e9f-4a1b-8c2d-3e4f5a6b7c89'::uuid, 'Hydrocortisone', 'topical');

    CALL doc_create_proc(
        p_oms => 2000000001,
        p_license => 1000000001,
        p_name => 'Consultation',
        p_remarks => 'Routine check-up',
        p_recommendations => 'Rest and drink plenty of fluids',
        p_time => TIMESTAMPTZ '2026-11-10 10:00:00+00',
        p_proc_id => v_proc_id
    );
    CALL doc_create_appl(v_proc_id, '9f1b8c2e-5d6a-4f0b-9a3c-1d2e3f4a5b61'::uuid, 1.0);
    CALL doc_create_appl(v_proc_id, '3c7d9e1a-2b4f-4c8d-8e6a-7f9b0c1d2e34'::uuid, 0.4);

    CALL doc_create_proc(
        p_oms => 2000000001,
        p_license => 1000000001,
        p_name => 'Dressing change',
        p_remarks => 'Small wound on the left hand',
        p_recommendations => 'Keep the wound clean and dry',
        p_time => TIMESTAMPTZ '2026-11-15 14:30:00+00',
        p_proc_id => v_proc_id
    );
    CALL doc_create_appl(v_proc_id, 'a4b5c6d7-8e9f-4a1b-8c2d-3e4f5a6b7c89'::uuid, 0.1);

    CALL doc_create_proc(
        p_oms => 2000000001,
        p_license => 1000000001,
        p_name => 'Follow-up consultation',
        p_remarks => 'Recovery confirmed',
        p_recommendations => 'No further visits needed',
        p_time => TIMESTAMPTZ '2026-11-22 09:00:00+00',
        p_proc_id => v_proc_id
    );
END;
$$;
