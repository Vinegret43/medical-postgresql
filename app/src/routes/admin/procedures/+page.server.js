import { fail } from '@sveltejs/kit';
import { requireRole } from '#lib/server/auth.js';
import { AdminError, deleteProcedure, getAllProcedures, isValidBigIntString } from '#lib/server/admin.js';

export async function load(event) {
	requireRole('admin', event);
	return { procedures: await getAllProcedures() };
}

export const actions = {
	delete: async (event) => {
		requireRole('admin', event);

		const data = await event.request.formData();
		const procId = String(data.get('proc_id') ?? '').trim();
		if (!isValidBigIntString(procId)) return fail(400, { message: 'Введите корректный идентификатор процедуры.' });

		try {
			await deleteProcedure(procId);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Не удалось удалить процедуру.';
			return fail(400, { message });
		}

		return { success: true, message: 'Процедура удалена.' };
	}
};
