import { isRoleGuardExempt, requireRole } from '#lib/server/auth.js';
import { getDoctor } from '#lib/server/doc.js';

/** Guards the whole /doc subtree and provides the doctor's name for the top bar. */
export async function load(event) {
	if (isRoleGuardExempt(event.route.id ?? '')) {
		return { showHeader: false, doctor: null };
	}

	const user = requireRole('doctor', event);
	const doctor = await getDoctor(user.subjectId);

	return { showHeader: true, doctor };
}
