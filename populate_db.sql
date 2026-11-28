
-- ============================================================================
--                              Demo data
-- ============================================================================
-- Matches the demo users in create_auth.sql:
--   admin login 'admin', patient OMS 2000000001, doctor license 1000000001.
-- Patient/doctor/medication/procedure rows are created only through the
-- procedures above, with one exception: admin accounts have no create
-- procedure, so the demo admin base row is inserted directly here to satisfy
-- the admin_login FK used for procedure audit fields.
-- The third procedure intentionally has no medications to exercise the empty state.

\c medical_lfv21;

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

    INSERT INTO admin_lfv21 (
        admin_login_lfv21,
        admin_fullname_lfv21,
        admin_birthdate_lfv21,
        admin_phone_lfv21
    ) VALUES ('admin', 'Админ Админович Админов', DATE '1990-01-01', '+79990000000');

    INSERT INTO auth_users (id, role, subject_id, credential) VALUES
        ('11111111-1111-4111-8111-111111111111', 'admin', 'admin',
         'fd1253e07b821a9bc318aa669b7237a3:4a67552e9511b01ce9538f4efa95bdb33370016e5da1098ff21b9404470227d2505e60d3b1999626af5437b476aafadd900308d8084b0466983530fa430a3353'),
        ('22222222-2222-4222-8222-222222222222', 'doctor', '1000000001', 'JBSWY3DPEHPK3PXP'),
        ('33333333-3333-4333-8333-333333333333', 'patient', '2000000001', 'GEZDGNBVGY3TQOJQ');
END;
$$;
