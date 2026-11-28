import { error } from '@sveltejs/kit';
import { requireRole } from '#lib/server/auth.js';
import { pool } from '#lib/server/db.js';

export async function load(event) {
	const user = requireRole('patient', event);
	const { id } = event.params;

	if (!/^\d{1,19}$/.test(id)) error(400, 'Некорректный идентификатор процедуры');

	const oms = user.subjectId;

	// Passing the session OMS makes the SQL functions reject foreign procedures.
	let medications;
	let procedure = null;
	try {
		const result = await pool.query(
			'SELECT * FROM get_procedure_medications($1::int8, $2::int8)',
			[id, oms]
		);
		medications = result.rows;

		// Only safe columns are projected; admin edit fields are never read here.
		const procedures = await pool.query(
			`SELECT
				proc_id,
				proc_time,
				proc_name,
				doctor_fullname AS doc_fullname,
				doctor_phone AS doc_phone,
				recommendations
			FROM get_procedure($1::int8, $2::int8)`,
			[id, oms]
		);
		procedure = procedures.rows[0] ?? null;
	} catch (err) {
		if (err?.code === 'P0002') error(404, 'Процедура не найдена');
		throw err;
	}

	return { procedure, medications };
}
