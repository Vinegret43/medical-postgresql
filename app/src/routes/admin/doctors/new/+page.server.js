import { fail, redirect } from '@sveltejs/kit';
import { requireRole } from '#lib/server/auth.js';
import {
	AdminError,
	createDoctorWithAuth,
	isValidBigIntString,
	isValidDate,
	isValidPhone
} from '#lib/server/admin.js';

export async function load(event) {
	requireRole('admin', event);
}

export const actions = {
	default: async (event) => {
		requireRole('admin', event);

		const data = await event.request.formData();
		const values = {
			license: String(data.get('license') ?? '').trim(),
			fullname: String(data.get('fullname') ?? '').trim(),
			birthdate: String(data.get('birthdate') ?? '').trim(),
			phone: String(data.get('phone') ?? '').trim()
		};

		if (!isValidBigIntString(values.license)) {
			return fail(400, { message: 'Enter a valid license number.', values });
		}
		if (!values.fullname || values.fullname.length > 70) {
			return fail(400, {
				message: 'Full name is required and must be at most 70 characters.',
				values
			});
		}
		if (!isValidDate(values.birthdate)) {
			return fail(400, { message: 'Enter a valid date of birth.', values });
		}
		if (!isValidPhone(values.phone)) {
			return fail(400, { message: 'Phone must be +7 followed by exactly 10 digits.', values });
		}

		try {
			await createDoctorWithAuth(values);
		} catch (error) {
			const message = error instanceof AdminError ? error.message : 'Could not create the doctor.';
			return fail(400, { message, values });
		}

		redirect(303, `/admin/doctors/${values.license}`);
	}
};
