import { requireRole } from '#lib/server/auth.js';
import { getMedications } from '#lib/server/doc.js';

export async function load(event) {
	requireRole('doctor', event);
	return { medications: await getMedications() };
}
