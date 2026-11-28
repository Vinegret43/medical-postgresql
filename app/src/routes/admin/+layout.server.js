import { isRoleGuardExempt, requireRole } from '#lib/server/auth.js';
import { getAdmin } from '#lib/server/admin.js';

/** Guards the whole /admin subtree; /admin/login stays public and header-exempt. */
export async function load(event) {
	if (isRoleGuardExempt(event.route.id ?? '')) {
		return { showHeader: false, admin: null };
	}

	const user = requireRole('admin', event);
  const admin = await getAdmin(user.subjectId);
	return { showHeader: true, admin };
}
