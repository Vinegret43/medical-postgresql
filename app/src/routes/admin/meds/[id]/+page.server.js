import { error, fail, redirect } from '@sveltejs/kit';
import { requireRole } from '#lib/server/auth.js';
import {
	AdminError,
	deleteMedication,
	getMedication,
	isNotFound,
	isValidUuid,
	updateMedication
} from '#lib/server/admin.js';

const FIELDS = new Set(['name', 'method']);

export async function load(event) {
	requireRole('admin', event);
	const { id } = event.params;

	if (!isValidUuid(id)) error(400, 'Некорректный UUID препарата');

	try {
		const medication = await getMedication(id);
		if (!medication) error(404, 'Препарат не найден');
		return { medication };
	} catch (err) {
		if (isNotFound(err)) error(404, 'Препарат не найден');
		throw err;
	}
}

export const actions = {
	updateField: async (event) => {
		requireRole('admin', event);
		const { id } = event.params;
		if (!isValidUuid(id)) return fail(400, { message: 'Введите корректный UUID.' });

		const data = await event.request.formData();
		const field = String(data.get('field') ?? '');
		const value = String(data.get('value') ?? '').trim();
		const values = { [field]: value };

		if (!FIELDS.has(field)) {
			return fail(400, { message: 'Неизвестное поле препарата.', field, values });
		}

		const max = field === 'name' ? 50 : 30;
		if (!value || value.length > max) {
			return fail(400, {
				message:
					field === 'name'
						? `Название обязательно и не должно превышать ${max} символов.`
						: `Способ применения обязателен и не должен превышать ${max} символов.`,
				field,
				values
			});
		}

		try {
			await updateMedication(id, values);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Не удалось изменить препарат.';
			return fail(400, { message, field, values });
		}

		return { success: true, field };
	},

	delete: async (event) => {
		requireRole('admin', event);
		const { id } = event.params;
		if (!isValidUuid(id)) return fail(400, { message: 'Введите корректный UUID.' });

		try {
			await deleteMedication(id);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Не удалось удалить препарат.';
			return fail(400, { message });
		}

		redirect(303, '/admin/meds');
	}
};
