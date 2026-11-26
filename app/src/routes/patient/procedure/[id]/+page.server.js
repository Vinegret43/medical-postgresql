import { error } from '@sveltejs/kit';
import { requireRole } from '#lib/server/auth.js';
import { pool } from '#lib/server/db.js';

export async function load(event) {
	const user = requireRole('patient', event);
	const { id } = event.params;

	if (!/^\d{1,19}$/.test(id)) error(400, 'Invalid procedure id');

	const oms = user.subjectId;

	// Both functions reject any procedure that does not belong to this OMS.
	let medications;
	let procedure = null;
	try {
		const result = await pool.query('SELECT * FROM pat_get_proc_meds($1::int8, $2::int8)', [
			id,
			oms
		]);
		medications = result.rows;

		// pat_get_proc deliberately omits admin edit fields.
		const procedures = await pool.query(
			`SELECT
				proc_id,
				proc_time,
				proc_name,
				doc_fullname,
				doc_phone,
				recommendations
			FROM pat_get_proc($1::int8, $2::int8)`,
			[oms, id]
		);
		procedure = procedures.rows[0] ?? null;
	} catch (err) {
		if (err?.code === 'P0002') error(404, 'Procedure not found');
		throw err;
	}

	return { procedure, medications };
}
