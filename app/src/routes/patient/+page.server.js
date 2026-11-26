import { requireRole } from '#lib/server/auth.js';
import { pool } from '#lib/server/db.js';

/** Only the session OMS is used — never an identifier from the URL or a form. */
export async function load(event) {
	const user = requireRole('patient', event);
	const { rows } = await pool.query(
		`SELECT
			proc_id,
			proc_time,
			proc_name,
			doctor_fullname AS doc_fullname,
			doctor_phone AS doc_phone,
			recommendations
		FROM get_procedures(p_pat_oms => $1::int8)
		ORDER BY proc_time DESC`,
		[user.subjectId]
	);

	return { procedures: rows };
}
