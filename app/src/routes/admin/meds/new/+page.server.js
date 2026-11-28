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
			return fail(400, { message: 'Enter a valid UUID.', values });
		}
		if (!values.name || values.name.length > 50) {
			return fail(400, {
				message: 'Name is required and must be at most 50 characters.',
				values
			});
		}
		if (!values.method || values.method.length > 30) {
			return fail(400, {
				message: 'Method is required and must be at most 30 characters.',
				values
			});
		}

		try {
			await createMedication(values);
		} catch (error) {
			const message = error instanceof AdminError ? error.message : 'Could not create the medication.';
			return fail(400, { message, values });
		}

		redirect(303, `/admin/meds/${values.id}`);
	}
};
