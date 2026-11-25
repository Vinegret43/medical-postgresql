import { requireRole } from '#lib/server/auth.js';
import { getMyProcedures } from '#lib/server/doc.js';

export async function load(event) {
	const user = requireRole('doctor', event);
	return { procedures: await getMyProcedures(user.subjectId) };
}
