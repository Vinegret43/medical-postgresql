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

	if (!isValidUuid(id)) error(400, 'Invalid medication UUID');

	try {
		const medication = await getMedication(id);
		if (!medication) error(404, 'Medication not found');
		return { medication };
	} catch (err) {
		if (isNotFound(err)) error(404, 'Medication not found');
		throw err;
	}
}

export const actions = {
	updateField: async (event) => {
		requireRole('admin', event);
		const { id } = event.params;
		if (!isValidUuid(id)) return fail(400, { message: 'Enter a valid UUID.' });

		const data = await event.request.formData();
		const field = String(data.get('field') ?? '');
		const value = String(data.get('value') ?? '').trim();
		const values = { [field]: value };

		if (!FIELDS.has(field)) {
			return fail(400, { message: 'Unknown medication field.', field, values });
		}

		const max = field === 'name' ? 50 : 30;
		if (!value || value.length > max) {
			return fail(400, {
				message: `${field === 'name' ? 'Name' : 'Method'} is required and must be at most ${max} characters.`,
				field,
				values
			});
		}

		try {
			await updateMedication(id, values);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Could not update the medication.';
			return fail(400, { message, field, values });
		}

		return { success: true, field };
	},

	delete: async (event) => {
		requireRole('admin', event);
		const { id } = event.params;
		if (!isValidUuid(id)) return fail(400, { message: 'Enter a valid UUID.' });

		try {
			await deleteMedication(id);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Could not delete the medication.';
			return fail(400, { message });
		}

		redirect(303, '/admin/meds');
	}
};
