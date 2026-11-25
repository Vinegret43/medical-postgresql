import { requireRole } from '#lib/server/auth.js';
import { getAllProcedures } from '#lib/server/doc.js';

export async function load(event) {
	requireRole('doctor', event);
	return { procedures: await getAllProcedures() };
}
