import { isRoleGuardExempt, requireRole } from '#lib/server/auth.js';
import { pool } from '#lib/server/db.js';

/**
 * Guards the whole /patient subtree (including client-side navigations) and
 * provides the patient's name for the shared top bar. Login stays public.
 */
export async function load(event) {
	if (isRoleGuardExempt(event.route.id ?? '')) {
		return { showHeader: false, patient: null };
	}

	const user = requireRole('patient', event);
	const { rows } = await pool.query('SELECT * FROM get_patient($1::int8)', [user.subjectId]);

	return { showHeader: true, patient: rows[0] ?? null };
}
