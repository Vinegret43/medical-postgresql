import { error, fail, redirect } from '@sveltejs/kit';
import { requireRole } from '#lib/server/auth.js';
import {
	AdminError,
	deletePatient,
	getPatient,
	getPatientProcedures,
	getTotpHandoff,
	isNotFound,
	isValidBigIntString,
	isValidDate,
	isValidPhone,
	regenerateTotpSecret,
	updatePatient
} from '#lib/server/admin.js';

const FIELDS = new Set(['fullname', 'birthdate', 'phone']);

function validateField(field, raw) {
	const value = String(raw ?? '').trim();
	if (field === 'fullname') {
		if (!value || value.length > 70) return 'Full name is required and must be at most 70 characters.';
	} else if (field === 'birthdate') {
		if (!isValidDate(value)) return 'Enter a valid date of birth.';
	} else if (field === 'phone') {
		if (!isValidPhone(value)) return 'Phone must be +7 followed by exactly 10 digits.';
	}
	return null;
}

export async function load(event) {
	requireRole('admin', event);
	const { oms } = event.params;

	if (!isValidBigIntString(oms)) error(400, 'Invalid OMS policy number');

	try {
		const patient = await getPatient(oms);
		if (!patient) error(404, 'Patient not found');

		return {
			patient,
			procedures: await getPatientProcedures(oms),
			totp: await getTotpHandoff('patient', oms)
		};
	} catch (err) {
		if (isNotFound(err)) error(404, 'Patient not found');
		throw err;
	}
}

export const actions = {
	updateField: async (event) => {
		requireRole('admin', event);
		const { oms } = event.params;
		if (!isValidBigIntString(oms)) return fail(400, { message: 'Enter a valid OMS number.' });

		const data = await event.request.formData();
		const field = String(data.get('field') ?? '');
		const raw = String(data.get('value') ?? '');
		const values = { [field]: raw.trim() };

		if (!FIELDS.has(field)) {
			return fail(400, { message: 'Unknown patient field.', field, values });
		}

		const validationError = validateField(field, raw);
		if (validationError) return fail(400, { message: validationError, field, values });

		try {
			await updatePatient(oms, values);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Could not update the patient.';
			return fail(400, { message, field, values });
		}

		return { success: true, field };
	},

	regenerateTotp: async (event) => {
		requireRole('admin', event);
		const { oms } = event.params;
		if (!isValidBigIntString(oms)) return fail(400, { message: 'Enter a valid OMS number.' });

		try {
			const handoff = await regenerateTotpSecret('patient', oms);
			return {
				success: true,
				message: 'The old secret no longer works and active sessions were revoked.',
				handoff
			};
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Could not regenerate the secret.';
			return fail(400, { message });
		}
	},

	delete: async (event) => {
		requireRole('admin', event);
		const { oms } = event.params;
		if (!isValidBigIntString(oms)) return fail(400, { message: 'Enter a valid OMS number.' });

		try {
			await deletePatient(oms);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Could not delete the patient.';
			return fail(400, { message });
		}

		redirect(303, '/admin/patients');
	}
};
