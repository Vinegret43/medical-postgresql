import { requireRole } from '#lib/server/auth.js';
import { searchDoctors } from '#lib/server/admin.js';

export async function load(event) {
	requireRole('admin', event);
	const q = String(event.url.searchParams.get('q') ?? '').trim();
	return { q, doctors: await searchDoctors(q) };
}
