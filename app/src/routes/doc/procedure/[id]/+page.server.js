import { error } from '@sveltejs/kit';
import { requireRole } from '#lib/server/auth.js';
import { getProcedure, getProcedureMedications } from '#lib/server/doc.js';

export async function load(event) {
	requireRole('doctor', event);
	const { id } = event.params;

	if (!/^\d{1,19}$/.test(id)) error(400, 'Некорректный идентификатор процедуры');

	const procedure = await getProcedure(id);
	if (!procedure) error(404, 'Процедура не найдена');

	return { procedure, medications: await getProcedureMedications(id) };
}
