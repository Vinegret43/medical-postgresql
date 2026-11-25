import { requireRole } from '#lib/server/auth.js';
import { searchPatients } from '#lib/server/doc.js';

export async function load(event) {
	requireRole('doctor', event);
	const q = String(event.url.searchParams.get('q') ?? '').trim();
	return { q, patients: await searchPatients(q) };
}
