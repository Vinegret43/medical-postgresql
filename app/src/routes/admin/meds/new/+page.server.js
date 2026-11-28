import { fail, redirect } from '@sveltejs/kit';
import { requireRole } from '#lib/server/auth.js';
import {
	AdminError,
	createMedication,
	isValidUuid
} from '#lib/server/admin.js';

export async function load(event) {
	requireRole('admin', event);
}

export const actions = {
	default: async (event) => {
		requireRole('admin', event);

		const data = await event.request.formData();
		const values = {
			id: String(data.get('id') ?? '').trim(),
			name: String(data.get('name') ?? '').trim(),
			method: String(data.get('method') ?? '').trim()
		};

		if (!isValidUuid(values.id)) {
			return fail(400, { message: 'Введите корректный UUID.', values });
		}
		if (!values.name || values.name.length > 50) {
			return fail(400, {
				message: 'Название обязательно и не должно превышать 50 символов.',
				values
			});
		}
		if (!values.method || values.method.length > 30) {
			return fail(400, {
				message: 'Способ применения обязателен и не должен превышать 30 символов.',
				values
			});
		}

		try {
			await createMedication(values);
		} catch (error) {
			const message = error instanceof AdminError ? error.message : 'Не удалось создать препарат.';
			return fail(400, { message, values });
		}

		redirect(303, `/admin/meds/${values.id}`);
	}
};
