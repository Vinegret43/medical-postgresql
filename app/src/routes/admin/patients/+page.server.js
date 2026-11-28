import { requireRole } from '#lib/server/auth.js';
import { searchPatients } from '#lib/server/admin.js';

export async function load(event) {
	requireRole('admin', event);
	const q = String(event.url.searchParams.get('q') ?? '').trim();
	return { q, patients: await searchPatients(q) };
}
