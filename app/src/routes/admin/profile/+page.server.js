import { requireRole } from '#lib/server/auth.js';
import { getAdmin } from '#lib/server/admin.js';

export async function load(event) {
	const user = requireRole('admin', event);
	// The login comes from the signed-in session, never from the URL or a form.
	return { login: user.subjectId, admin: await getAdmin(user.subjectId) };
}
