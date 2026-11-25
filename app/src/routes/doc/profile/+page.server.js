import { requireRole } from '#lib/server/auth.js';
import { getDoctor } from '#lib/server/doc.js';

export async function load(event) {
	const user = requireRole('doctor', event);
	return { license: user.subjectId, doctor: await getDoctor(user.subjectId) };
}
