import { error, fail, redirect } from '@sveltejs/kit';
import { requireRole } from '#lib/server/auth.js';
import {
	AdminError,
	deleteDoctor,
	getDoctor,
	getDoctorProcedures,
	getTotpHandoff,
	isNotFound,
	isValidBigIntString,
	isValidDate,
	isValidPhone,
	regenerateTotpSecret,
	updateDoctor
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
	const { license } = event.params;

	if (!isValidBigIntString(license)) error(400, 'Invalid doctor license');

	try {
		const doctor = await getDoctor(license);
		if (!doctor) error(404, 'Doctor not found');

		return {
			doctor,
			procedures: await getDoctorProcedures(license),
			totp: await getTotpHandoff('doctor', license)
		};
	} catch (err) {
		if (isNotFound(err)) error(404, 'Doctor not found');
		throw err;
	}
}

export const actions = {
	updateField: async (event) => {
		requireRole('admin', event);
		const { license } = event.params;
		if (!isValidBigIntString(license)) return fail(400, { message: 'Enter a valid license number.' });

		const data = await event.request.formData();
		const field = String(data.get('field') ?? '');
		const raw = String(data.get('value') ?? '');
		const values = { [field]: raw.trim() };

		if (!FIELDS.has(field)) {
			return fail(400, { message: 'Unknown doctor field.', field, values });
		}

		const validationError = validateField(field, raw);
		if (validationError) return fail(400, { message: validationError, field, values });

		try {
			await updateDoctor(license, values);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Could not update the doctor.';
			return fail(400, { message, field, values });
		}

		return { success: true, field };
	},

	regenerateTotp: async (event) => {
		requireRole('admin', event);
		const { license } = event.params;
		if (!isValidBigIntString(license)) return fail(400, { message: 'Enter a valid license number.' });

		try {
			const handoff = await regenerateTotpSecret('doctor', license);
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
		const { license } = event.params;
		if (!isValidBigIntString(license)) return fail(400, { message: 'Enter a valid license number.' });

		try {
			await deleteDoctor(license);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Could not delete the doctor.';
			return fail(400, { message });
		}

		redirect(303, '/admin/doctors');
	}
};
