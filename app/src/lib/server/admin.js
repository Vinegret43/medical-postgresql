import QRCode from 'qrcode';
import * as OTPAuth from 'otpauth';
import { AuthUser, Session, pool, sequelize } from './db.js';

const INT8_MAX = 2n ** 63n - 1n;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_RE = /^\+7\d{10}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export class AdminError extends Error {
	constructor(message, code, cause) {
		super(message);
		this.name = 'AdminError';
		this.code = code ?? null;
		this.cause = cause;
	}
}

function codeOf(error) {
	return error?.code ?? error?.parent?.code ?? error?.original?.code ?? null;
}

export function toAdminError(error, fallback = 'Не удалось сохранить изменение.') {
	if (error instanceof AdminError) return error;

	switch (codeOf(error)) {
		case '23505':
			return new AdminError('Запись с таким ОМС, лицензией или UUID уже существует.', '23505', error);
		case '23514':
			return new AdminError('Телефон должен начинаться с +7 и содержать ровно 10 цифр.', '23514', error);
		case '23503':
		case '23001':
			return new AdminError(
				'Нельзя удалить: на эту запись ещё ссылаются процедуры или препараты.',
				codeOf(error),
				error
			);
		case 'P0002':
			return new AdminError('Запись не найдена.', 'P0002', error);
		case '22P02':
			return new AdminError('Введите корректный UUID.', '22P02', error);
		case '22007':
		case '22008':
			return new AdminError('Введите корректную дату или время.', '22007', error);
		case '22001':
			return new AdminError('Одно из значений слишком длинное.', '22001', error);
		case '23502':
			return new AdminError('Обязательные поля не должны быть пустыми.', '23502', error);
		default:
			return new AdminError(fallback, codeOf(error), error);
	}
}

export function isNotFound(error) {
	const code = error instanceof AdminError ? error.code : codeOf(error);
	return code === 'P0002';
}

export function isValidBigIntString(value) {
	if (typeof value !== 'string' || !/^\d{1,19}$/.test(value)) return false;
	try {
		return BigInt(value) <= INT8_MAX;
	} catch {
		return false;
	}
}

export function isValidUuid(value) {
	return typeof value === 'string' && UUID_RE.test(value);
}

export function isValidPhone(value) {
	return typeof value === 'string' && PHONE_RE.test(value);
}

export function isValidDate(value) {
	if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
	const parsed = new Date(`${value}T00:00:00Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function isValidDateTimeLocal(value) {
	return typeof value === 'string' && DATETIME_LOCAL_RE.test(value) && !Number.isNaN(new Date(`${value}Z`).getTime());
}

export function dateTimeLocalToIso(value) {
	if (!isValidDateTimeLocal(value)) return null;
	return new Date(`${value}Z`).toISOString();
}

export function nullableText(value) {
	const text = String(value ?? '').trim();
	return text || null;
}

async function query(sql, params, fallback) {
	try {
		return await pool.query(sql, params);
	} catch (error) {
		throw toAdminError(error, fallback);
	}
}

async function withClientTransaction(work) {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const result = await work(client);
		await client.query('COMMIT');
		return result;
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
}

function newTotpSecret() {
	return new OTPAuth.Secret({ size: 20 }).base32;
}

async function buildTotpHandoff(role, subjectId, secret) {
	const totp = new OTPAuth.TOTP({
		issuer: 'Медицинский сервис',
		label: `${role}:${subjectId}`,
		algorithm: 'SHA1',
		digits: 6,
		period: 30,
		secret: OTPAuth.Secret.fromBase32(secret)
	});
	const uri = totp.toString();
	const qrDataUrl = await QRCode.toDataURL(uri, { errorCorrectionLevel: 'M', margin: 1, width: 256 });

	return { secret, uri, qrDataUrl };
}

async function createWithAuth(role, subjectId, procedureSql, params) {
	const secret = newTotpSecret();

	try {
		await sequelize.transaction(async (transaction) => {
			await sequelize.query(procedureSql, { bind: params, transaction });
			await AuthUser.create({ role, subjectId, credential: secret }, { transaction });
		});
	} catch (error) {
		throw toAdminError(error, 'Не удалось создать запись и учётную запись для входа.');
	}

	return buildTotpHandoff(role, subjectId, secret);
}

// ---------------------------------------------------------------------------
// TOTP handoff
// ---------------------------------------------------------------------------

export async function getTotpHandoff(role, subjectId) {
	const user = await AuthUser.findOne({ where: { role, subjectId } });
	if (!user) return null;
	return buildTotpHandoff(role, subjectId, user.credential);
}

export async function regenerateTotpSecret(role, subjectId) {
	const secret = newTotpSecret();
	const user = await AuthUser.findOne({ where: { role, subjectId } });

	if (!user) {
		await AuthUser.create({ role, subjectId, credential: secret });
	} else {
		await sequelize.transaction(async (transaction) => {
			await AuthUser.update({ credential: secret }, { where: { id: user.id }, transaction });
			await Session.destroy({ where: { userId: user.id }, transaction });
		});
	}

	return buildTotpHandoff(role, subjectId, secret);
}

// ---------------------------------------------------------------------------
// Current admin (profile)
// ---------------------------------------------------------------------------

export async function getAdmin(login) {
	const { rows } = await query(
		`SELECT login, fullname, birthdate::text AS birthdate, phone
		FROM get_admin($1::varchar(30))`,
		[login],
		'Не удалось загрузить профиль администратора.'
	);
	return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

export async function searchPatients(q) {
	const { rows } = await query(
		`SELECT oms, fullname, birthdate::text AS birthdate, phone
		FROM search_patients($1)`,
		[String(q ?? '').trim()],
		'Не удалось загрузить пациентов.'
	);
	return rows;
}

export async function getPatient(oms) {
	const { rows } = await query(
		`SELECT oms, fullname, birthdate::text AS birthdate, phone
		FROM get_patient($1::int8)`,
		[oms],
		'Не удалось загрузить пациента.'
	);
	return rows[0] ?? null;
}

export async function createPatientWithAuth({ oms, fullname, birthdate, phone }) {
	return createWithAuth(
		'patient',
		oms,
		`CALL admin_create_patient($1::int8, $2::varchar(70), $3::date, $4::varchar(15))`,
		[oms, fullname, birthdate, phone]
	);
}

export async function updatePatient(oms, fields) {
	await query(
		`CALL admin_update_patient($1::int8, $2::varchar(70), $3::date, $4::varchar(15))`,
		[oms, fields.fullname ?? null, fields.birthdate ?? null, fields.phone ?? null],
		'Не удалось изменить пациента.'
	);
}

export async function getPatientProcedures(oms) {
	const { rows } = await query(
		`SELECT
			pr.proc_id,
			pr.oms,
			pr.patient_fullname,
			pr.license,
			pr.doctor_fullname,
			pr.proc_time,
			pr.proc_name,
			pr.remarks,
			pr.recommendations,
			pr.admin_login,
			pr.admin_edit_timestamp
		FROM get_procedures(p_pat_oms => $1::int8) AS pr
		ORDER BY pr.proc_time DESC, pr.proc_id DESC`,
		[oms],
		'Не удалось загрузить процедуры пациента.'
	);
	return rows;
}

export async function deletePatient(oms) {
	await query(`CALL admin_delete_patient($1::int8)`, [oms], 'Не удалось удалить пациента.');
}

// ---------------------------------------------------------------------------
// Doctors
// ---------------------------------------------------------------------------

export async function searchDoctors(q) {
	const { rows } = await query(
		`SELECT license, fullname, birthdate::text AS birthdate, phone
		FROM search_doctors($1)`,
		[String(q ?? '').trim()],
		'Не удалось загрузить врачей.'
	);
	return rows;
}

export async function getDoctor(license) {
	const { rows } = await query(
		`SELECT license, fullname, birthdate::text AS birthdate, phone
		FROM get_doctor($1::int8)`,
		[license],
		'Не удалось загрузить врача.'
	);
	return rows[0] ?? null;
}

export async function createDoctorWithAuth({ license, fullname, birthdate, phone }) {
	return createWithAuth(
		'doctor',
		license,
		`CALL admin_create_doctor($1::int8, $2::varchar(70), $3::date, $4::varchar(15))`,
		[license, fullname, birthdate, phone]
	);
}

export async function updateDoctor(license, fields) {
	await query(
		`CALL admin_update_doctor($1::int8, $2::varchar(70), $3::date, $4::varchar(15))`,
		[license, fields.fullname ?? null, fields.birthdate ?? null, fields.phone ?? null],
		'Не удалось изменить врача.'
	);
}

export async function getDoctorProcedures(license) {
	const { rows } = await query(
		`SELECT
			pr.proc_id,
			pr.oms,
			pr.patient_fullname,
			pr.license,
			pr.doctor_fullname,
			pr.proc_time,
			pr.proc_name,
			pr.remarks,
			pr.recommendations,
			pr.admin_login,
			pr.admin_edit_timestamp
		FROM get_procedures(p_doc_license => $1::int8) AS pr
		ORDER BY pr.proc_time DESC, pr.proc_id DESC`,
		[license],
		'Не удалось загрузить процедуры врача.'
	);
	return rows;
}

export async function deleteDoctor(license) {
	await query(`CALL admin_delete_doctor($1::int8)`, [license], 'Не удалось удалить врача.');
}

// ---------------------------------------------------------------------------
// Medications
// ---------------------------------------------------------------------------

export async function getMedications() {
	const { rows } = await query(
		`SELECT id, name, method FROM get_medications()`,
		[],
		'Не удалось загрузить препараты.'
	);
	return rows;
}

export async function getMedication(id) {
	const { rows } = await query(
		`SELECT id, name, method FROM get_medication($1::uuid)`,
		[id],
		'Не удалось загрузить препарат.'
	);
	return rows[0] ?? null;
}

export async function createMedication({ id, name, method }) {
	await query(
		`CALL admin_create_medication($1::uuid, $2::varchar(50), $3::varchar(30))`,
		[id, name, method],
		'Не удалось создать препарат.'
	);
}

export async function updateMedication(id, fields) {
	await query(
		`CALL admin_update_med($1::uuid, $2::varchar(50), $3::varchar(30))`,
		[id, fields.name ?? null, fields.method ?? null],
		'Не удалось изменить препарат.'
	);
}

export async function deleteMedication(id) {
	await query(`CALL admin_delete_med($1::uuid)`, [id], 'Не удалось удалить препарат.');
}

// ---------------------------------------------------------------------------
// Procedures and applications
// ---------------------------------------------------------------------------

export async function getAllProcedures() {
	const { rows } = await query(
		`SELECT
			pr.proc_id,
			pr.oms,
			pr.patient_fullname,
			pr.license,
			pr.doctor_fullname,
			pr.proc_time,
			pr.proc_name,
			pr.remarks,
			pr.recommendations,
			pr.admin_login,
			pr.admin_edit_timestamp
		FROM get_procedures() AS pr
		ORDER BY pr.proc_time DESC, pr.proc_id DESC`,
		[],
		'Не удалось загрузить процедуры.'
	);
	return rows;
}

export async function getProcedure(id) {
	const { rows } = await query(
		`SELECT
			proc_id,
			oms,
			patient_fullname,
			license,
			doctor_fullname,
			proc_time,
			proc_name,
			remarks,
			recommendations,
			admin_login,
			admin_edit_timestamp
		FROM get_procedure($1::int8)`,
		[id],
		'Не удалось загрузить процедуру.'
	);
	return rows[0] ?? null;
}

export async function getProcedureMedications(id) {
	const { rows } = await query(
		`SELECT med_id, med_name, med_method, dosage
		FROM get_procedure_medications($1::int8)
		ORDER BY med_name, med_id`,
		[id],
		'Не удалось загрузить назначения.'
	);
	return rows;
}

/**
 * Both the quick inline edits and the full edit page funnel through here.
 * Omitted fields keep their current value; only the four editable fields are
 * ever accepted from a form.
 */
export async function updateProcedure(id, fields, adminLogin) {
	const current = await getProcedure(id);
	if (!current) throw new AdminError('Запись не найдена.', 'P0002');

	let procTime = fields.proc_time ?? current.proc_time;
	if (typeof procTime === 'string' && DATETIME_LOCAL_RE.test(procTime)) {
		procTime = dateTimeLocalToIso(procTime);
	}
	if (!procTime) throw new AdminError('Введите корректное время процедуры.', '22007');

	await query(
		`CALL admin_update_proc(
			$1::int8,
			$2::varchar(200),
			$3::text,
			$4::text,
			$5::timestamptz,
			$6::varchar(30)
		)`,
		[
			id,
			fields.proc_name ?? current.proc_name,
			fields.remarks === undefined ? current.remarks : nullableText(fields.remarks),
			fields.recommendations === undefined ? current.recommendations : nullableText(fields.recommendations),
			procTime,
			adminLogin
		],
		'Не удалось изменить процедуру.'
	);
}

export async function deleteProcedure(id) {
	await query(`CALL admin_delete_proc($1::int8)`, [id], 'Не удалось удалить процедуру.');
}

export async function addApplication(procId, medId, dosage, adminLogin) {
	try {
		await withClientTransaction(async (client) => {
			await client.query('CALL doc_create_appl($1::int8, $2::uuid, $3::float8)', [procId, medId, dosage]);
			await client.query('CALL admin_touch_proc($1::int8, $2::varchar(30))', [procId, adminLogin]);
		});
	} catch (error) {
		if (codeOf(error) === '23505') {
			throw new AdminError(
				'Этот препарат уже назначен в процедуре. Измените его дозировку.',
				'23505',
				error
			);
		}
		throw toAdminError(error, 'Не удалось добавить препарат.');
	}
}

export async function updateApplication(procId, medId, dosage, adminLogin) {
	try {
		await withClientTransaction(async (client) => {
			await client.query('CALL admin_update_appl($1::int8, $2::uuid, $3::float8)', [procId, medId, dosage]);
			await client.query('CALL admin_touch_proc($1::int8, $2::varchar(30))', [procId, adminLogin]);
		});
	} catch (error) {
		throw toAdminError(error, 'Не удалось изменить дозировку.');
	}
}

export async function deleteApplication(procId, medId, adminLogin) {
	try {
		await withClientTransaction(async (client) => {
			await client.query('CALL admin_delete_appl($1::int8, $2::uuid)', [procId, medId]);
			await client.query('CALL admin_touch_proc($1::int8, $2::varchar(30))', [procId, adminLogin]);
		});
	} catch (error) {
		throw toAdminError(error, 'Не удалось убрать препарат.');
	}
}
