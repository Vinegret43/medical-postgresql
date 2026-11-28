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
		if (!value || value.length > 70) return 'ФИО обязательно и не должно превышать 70 символов.';
	} else if (field === 'birthdate') {
		if (!isValidDate(value)) return 'Введите корректную дату рождения.';
	} else if (field === 'phone') {
		if (!isValidPhone(value)) return 'Телефон должен начинаться с +7 и содержать ровно 10 цифр.';
	}
	return null;
}

export async function load(event) {
	requireRole('admin', event);
	const { license } = event.params;

	if (!isValidBigIntString(license)) error(400, 'Некорректная лицензия врача');

	try {
		const doctor = await getDoctor(license);
		if (!doctor) error(404, 'Врач не найден');

		return {
			doctor,
			procedures: await getDoctorProcedures(license),
			totp: await getTotpHandoff('doctor', license)
		};
	} catch (err) {
		if (isNotFound(err)) error(404, 'Врач не найден');
		throw err;
	}
}

export const actions = {
	updateField: async (event) => {
		requireRole('admin', event);
		const { license } = event.params;
		if (!isValidBigIntString(license)) return fail(400, { message: 'Введите корректный номер лицензии.' });

		const data = await event.request.formData();
		const field = String(data.get('field') ?? '');
		const raw = String(data.get('value') ?? '');
		const values = { [field]: raw.trim() };

		if (!FIELDS.has(field)) {
			return fail(400, { message: 'Неизвестное поле врача.', field, values });
		}

		const validationError = validateField(field, raw);
		if (validationError) return fail(400, { message: validationError, field, values });

		try {
			await updateDoctor(license, values);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Не удалось изменить врача.';
			return fail(400, { message, field, values });
		}

		return { success: true, field };
	},

	regenerateTotp: async (event) => {
		requireRole('admin', event);
		const { license } = event.params;
		if (!isValidBigIntString(license)) return fail(400, { message: 'Введите корректный номер лицензии.' });

		try {
			const handoff = await regenerateTotpSecret('doctor', license);
			return {
				success: true,
				message: 'Старый секрет больше не работает, все активные сеансы отозваны.',
				handoff
			};
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Не удалось сгенерировать новый секрет.';
			return fail(400, { message });
		}
	},

	delete: async (event) => {
		requireRole('admin', event);
		const { license } = event.params;
		if (!isValidBigIntString(license)) return fail(400, { message: 'Введите корректный номер лицензии.' });

		try {
			await deleteDoctor(license);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Не удалось удалить врача.';
			return fail(400, { message });
		}

		redirect(303, '/admin/doctors');
	}
};
