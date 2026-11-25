
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
    FOREIGN KEY (pat_oms_lfv21) REFERENCES pat_lfv21(pat_oms_lfv21), -- ON DELETE RESTRICT
    FOREIGN KEY (doc_license_lfv21) REFERENCES doc_lfv21(doc_license_lfv21), -- ON DELETE RESTRICT
    FOREIGN KEY (admin_login_lfv21) REFERENCES admin_lfv21(admin_login_lfv21) -- ON DELETE SET NULL
);

CREATE TABLE meds_lfv21 (
    proc_meds_id_lfv21 uuid NOT NULL, -- This is never automatically generated; ids are inputted manually
    proc_meds_name_lfv21 varchar(50) NOT NULL, -- The (name, method) pair does not have to be unique
    proc_meds_method_lfv21 varchar(30) NOT NULL,
    PRIMARY KEY (proc_meds_id_lfv21)
);

CREATE TABLE appl_lfv21 (
    proc_id_lfv21 int8 NOT NULL,
    proc_meds_id_lfv21 uuid NOT NULL,
    proc_meds_dosage_lfv21 float8 NOT NULL, -- CHECK > 0
    PRIMARY KEY (proc_id_lfv21, proc_meds_id_lfv21),
    FOREIGN KEY (proc_id_lfv21) REFERENCES proc_lfv21(proc_id_lfv21), -- ON DELETE CASCADE
    FOREIGN KEY (proc_meds_id_lfv21) REFERENCES meds_lfv21(proc_meds_id_lfv21) -- ON DELETE RESTRICT
);

-- CREATE

-- процедура добавления нового пациента
-- процедура добавления нового доктора

-- процедура добавления новой процедуры (proc)
-- процедура добавления нового лекарства
-- процедура добавления нового применения лекарства (appl)



-- Retrieve (Only views and functions allowed, no direct SELECT on table).
-- Right now, just return all the columns, I will remove unneded things manually
-- Use table function if applying some sort of filtering to the selection,
-- otherwise use views

-- Для пациентов
-- Получить полные данные пациента из таблицы pat
-- Получить таблицу с процедурами пациента (функция(oms)). proc JOIN doc.
--  It's ok that we directly pass oms, I will handle safety in application code
-- Получить таблицу с медикаментами, использованными в выбранной процедуре (функиця(proc_id, oms)).
--  Если ОМС не совпадает --- шлём на хрен (возвращаем ошибку). Если совпал --- proc JOIN appl JOIN meds WHERE proc_id=...
-- Скалярная фукнция -- суммарное число пройденных процедур

-- Для докторов
-- Получить список всех процедур
-- Получить список всех пациентов
-- Получить список всех лекарств
-- Получить список процедур конкретного пациента
-- Получить информацию о конкретной процедуре с использованными медикаментами proc JOIN appl JOIN meds.
--  У пациента есть похожая процедура, но там есть проверка ОМС, а здесь нет
-- Получить список процедур конкретного доктора (функция(license))
-- Скалярная фукнция -- суммарное число проведённых процедур

-- Админские функции
-- Получить список всех докторов
-- Все остальные функции --- доступны и админам тоже


-- UPDATE (admin-only)

-- процедура обновления данных пациента
-- процедура обновления данных доктора
-- процедура обновления данных администратора
-- процедура обновления данных медикамента (meds)
-- процедура обновления данных применения медикамента (дозировки) (appl)

-- DELETE (admin-only)
-- Процедура удаления пациента (pat)
-- Процедура удаления доктора (doc)
-- Процедура удаления медикамента (meds)
-- Процедура удаления процедуры (proc)
-- Процедура удаления применения медикамента (appl)

-- TODO: триггер, который при обновлении таблицы proc автоматически ставит время обновления на текущее время.
--   Сам админ при обновлении процедуры время не устанавливает, это делает триггер.
-- TODO: триггер, который при обновлении таблицы pat проверяет правильность формата телефона
-- TODO: триггер, который при обновлении таблицы doc проверяет правильность формата телефона
-- TODO: триггер, который при обновлении таблицы admin проверяет правильность формата телефона

-- Индексы
-- Просмотреть на написанные функции и представления. Понять, какие из них можно ускорить,
-- добавив индексы

-- No create/update for admin, this is done manually through the shell

-- Разграничение доступа. Три категории пользователей: patient, doctor, admin
-- (CREATE ROLE ___ WITH PASSWORD 'patient', 'doctor', etc. Just leave placeholder
-- passwords for now)
