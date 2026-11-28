import { requireRole } from '#lib/server/auth.js';
import { getMedications } from '#lib/server/admin.js';

export async function load(event) {
	requireRole('admin', event);
	return { medications: await getMedications() };
}
