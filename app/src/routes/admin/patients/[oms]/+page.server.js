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
	const { oms } = event.params;

	if (!isValidBigIntString(oms)) error(400, 'Некорректный номер полиса ОМС');

	try {
		const patient = await getPatient(oms);
		if (!patient) error(404, 'Пациент не найден');

		return {
			patient,
			procedures: await getPatientProcedures(oms),
			totp: await getTotpHandoff('patient', oms)
		};
	} catch (err) {
		if (isNotFound(err)) error(404, 'Пациент не найден');
		throw err;
	}
}

export const actions = {
	updateField: async (event) => {
		requireRole('admin', event);
		const { oms } = event.params;
		if (!isValidBigIntString(oms)) return fail(400, { message: 'Введите корректный номер ОМС.' });

		const data = await event.request.formData();
		const field = String(data.get('field') ?? '');
		const raw = String(data.get('value') ?? '');
		const values = { [field]: raw.trim() };

		if (!FIELDS.has(field)) {
			return fail(400, { message: 'Неизвестное поле пациента.', field, values });
		}

		const validationError = validateField(field, raw);
		if (validationError) return fail(400, { message: validationError, field, values });

		try {
			await updatePatient(oms, values);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Не удалось изменить пациента.';
			return fail(400, { message, field, values });
		}

		return { success: true, field };
	},

	regenerateTotp: async (event) => {
		requireRole('admin', event);
		const { oms } = event.params;
		if (!isValidBigIntString(oms)) return fail(400, { message: 'Введите корректный номер ОМС.' });

		try {
			const handoff = await regenerateTotpSecret('patient', oms);
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
		const { oms } = event.params;
		if (!isValidBigIntString(oms)) return fail(400, { message: 'Введите корректный номер ОМС.' });

		try {
			await deletePatient(oms);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Не удалось удалить пациента.';
			return fail(400, { message });
		}

		redirect(303, '/admin/patients');
	}
};
