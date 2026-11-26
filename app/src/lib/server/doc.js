import { pool } from './db.js';

/** All doctor-facing reads go through the views/functions in create_db.sql. */

export async function getDoctor(license) {
	const { rows } = await pool.query(
		`SELECT license, fullname, birthdate::text AS birthdate, phone
		FROM get_doctor($1::int8)`,
		[license]
	);
	return rows[0] ?? null;
}

export async function getMyProcedures(license) {
	const { rows } = await pool.query(
		`SELECT
			pr.proc_id,
			pr.oms,
			pr.patient_fullname,
			pr.proc_time,
			pr.proc_name,
			pr.remarks,
			pr.recommendations,
			pr.admin_login,
			pr.admin_edit_timestamp
		FROM get_procedures(p_doc_license => $1::int8) AS pr
		ORDER BY pr.proc_time DESC, pr.proc_id DESC`,
		[license]
	);
	return rows;
}

export async function getAllProcedures() {
	const { rows } = await pool.query(
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
		ORDER BY pr.proc_time DESC, pr.proc_id DESC`
	);
	return rows;
}

export async function searchPatients(query) {
	const q = String(query ?? '').trim();
	const { rows } = await pool.query(
		`SELECT oms, fullname, birthdate::text AS birthdate, phone
		FROM search_patients($1)`,
		[q]
	);
	return rows;
}

export async function getPatient(oms) {
	const { rows } = await pool.query(
		`SELECT oms, fullname, birthdate::text AS birthdate, phone
		FROM get_patient($1::int8)`,
		[oms]
	);
	return rows[0] ?? null;
}

export async function getPatientProcedures(oms) {
	const { rows } = await pool.query(
		`SELECT
			proc_id,
			oms,
			license,
			doctor_fullname AS doc_fullname,
			doctor_phone AS doc_phone,
			proc_time,
			proc_name,
			remarks,
			recommendations,
			admin_login,
			admin_edit_timestamp
		FROM get_procedures(p_pat_oms => $1::int8)
		ORDER BY proc_time DESC, proc_id DESC`,
		[oms]
	);
	return rows;
}

export async function getProcedure(procId) {
	const { rows } = await pool.query(
		`SELECT
			proc_id,
			oms,
			license,
			proc_time,
			proc_name,
			remarks,
			recommendations,
			admin_login,
			admin_edit_timestamp
		FROM get_procedure($1::int8)`,
		[procId]
	);
	return rows[0] ?? null;
}

export async function getProcedureMedications(procId) {
	const { rows } = await pool.query(
		`SELECT med_id, med_name, med_method, dosage
		FROM get_procedure_medications($1::int8)
		ORDER BY med_name, med_id`,
		[procId]
	);
	return rows;
}

export async function getMedications() {
	const { rows } = await pool.query(`SELECT id, name, method FROM get_medications()`);
	return rows;
}

/**
 * Creates the procedure and every application in one transaction.
 * Never writes to proc_lfv21 / appl_lfv21 directly.
 */
export async function createProcedureWithMedications({
	oms,
	license,
	name,
	remarks,
	recommendations,
	procTime,
	medications
}) {
	const client = await pool.connect();

	try {
		await client.query('BEGIN');

		const created = await client.query(
			`CALL doc_create_proc(
				$1::int8,
				$2::int8,
				$3::varchar(200),
				$4::text,
				$5::text,
				$6::timestamptz,
				NULL::int8
			)`,
			[oms, license, name, remarks ?? null, recommendations ?? null, procTime ?? null]
		);

		const procId = created.rows[0]?.p_proc_id;
		if (procId === undefined || procId === null) {
			throw new Error('doc_create_proc did not return a procedure id');
		}

		for (const medication of medications) {
			await client.query('CALL doc_create_appl($1::int8, $2::uuid, $3::float8)', [
				procId,
				medication.id,
				medication.dosage
			]);
		}

		await client.query('COMMIT');
		return String(procId);
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
}
