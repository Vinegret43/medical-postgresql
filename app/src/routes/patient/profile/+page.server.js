import { requireRole } from '#lib/server/auth.js';
import { pool } from '#lib/server/db.js';

export async function load(event) {
	const user = requireRole('patient', event);
	// Cast the date to text so it does not shift a day when Node parses it in UTC.
	const { rows } = await pool.query(
		`SELECT oms, fullname, birthdate::text AS birthdate, phone
		FROM pat_get_patient($1::int8)`,
		[user.subjectId]
	);

	return { oms: user.subjectId, patient: rows[0] ?? null };
}
