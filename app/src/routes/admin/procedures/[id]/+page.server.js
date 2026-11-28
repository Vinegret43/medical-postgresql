import { error, fail, redirect } from '@sveltejs/kit';
import { requireRole } from '#lib/server/auth.js';
import {
	AdminError,
	addApplication,
	dateTimeLocalToIso,
	deleteApplication,
	deleteProcedure,
	getMedication,
	getMedications,
	getProcedure,
	getProcedureMedications,
	isNotFound,
	isValidBigIntString,
	isValidDateTimeLocal,
	isValidUuid,
	updateApplication,
	updateProcedure
} from '#lib/server/admin.js';

const FIELDS = new Set(['proc_name', 'proc_time', 'remarks', 'recommendations']);

function validateProcedureField(field, raw) {
	const value = String(raw ?? '').trim();

	if (field === 'proc_name') {
		if (!value || value.length > 200) return { message: 'Название обязательно и не должно превышать 200 символов.' };
		return { value };
	}
	if (field === 'proc_time') {
		if (!isValidDateTimeLocal(value)) return { message: 'Введите корректное время процедуры.' };
		return { value: dateTimeLocalToIso(value) };
	}
	return { value: value || null };
}

function parseDosage(raw) {
	const dosage = Number(String(raw ?? '').trim());
	return Number.isFinite(dosage) && dosage > 0 ? dosage : null;
}

export async function load(event) {
	requireRole('admin', event);
	const { id } = event.params;

	if (!isValidBigIntString(id)) error(400, 'Некорректный идентификатор процедуры');

	try {
		const procedure = await getProcedure(id);
		if (!procedure) error(404, 'Процедура не найдена');

		return {
			procedure,
			applications: await getProcedureMedications(id),
			medications: await getMedications()
		};
	} catch (err) {
		if (isNotFound(err)) error(404, 'Процедура не найдена');
		throw err;
	}
}

export const actions = {
	updateField: async (event) => {
		const user = requireRole('admin', event);
		const { id } = event.params;
		if (!isValidBigIntString(id)) return fail(400, { message: 'Введите корректный идентификатор процедуры.' });

		const data = await event.request.formData();
		const field = String(data.get('field') ?? '');
		const raw = String(data.get('value') ?? '');
		const values = { [field]: raw };

		if (!FIELDS.has(field)) {
			return fail(400, { message: 'Неизвестное поле процедуры.', field, values });
		}

		const result = validateProcedureField(field, raw);
		if (result.message) return fail(400, { message: result.message, field, values });

		try {
			await updateProcedure(id, { [field]: result.value }, user.subjectId);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Не удалось изменить процедуру.';
			return fail(400, { message, field, values });
		}

		return { success: true, field };
	},

	addApplication: async (event) => {
		const user = requireRole('admin', event);
		const { id } = event.params;
		if (!isValidBigIntString(id)) return fail(400, { message: 'Введите корректный идентификатор процедуры.' });

		const data = await event.request.formData();
		const medId = String(data.get('med_id') ?? '').trim();
		const dosageRaw = String(data.get('dosage') ?? '').trim();
		const values = { med_id: medId, dosage: dosageRaw };

		if (!isValidUuid(medId)) return fail(400, { message: 'Выберите препарат из каталога.', values });

		const dosage = parseDosage(dosageRaw);
		if (dosage === null) return fail(400, { message: 'Дозировка должна быть больше нуля.', values });

		const medication = await getMedication(medId);
		if (!medication) return fail(400, { message: 'Выберите препарат из каталога.', values });

		try {
			await addApplication(id, medId, dosage, user.subjectId);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Не удалось добавить препарат.';
			return fail(400, { message, values });
		}

		return { success: true, message: 'Препарат добавлен в процедуру.' };
	},

	updateApplication: async (event) => {
		const user = requireRole('admin', event);
		const { id } = event.params;
		if (!isValidBigIntString(id)) return fail(400, { message: 'Введите корректный идентификатор процедуры.' });

		const data = await event.request.formData();
		const medId = String(data.get('med_id') ?? '').trim();
		const dosageRaw = String(data.get('dosage') ?? '').trim();
		const values = { med_id: medId, dosage: dosageRaw };

		if (!isValidUuid(medId)) return fail(400, { message: 'Выберите препарат из каталога.', values });

		const dosage = parseDosage(dosageRaw);
		if (dosage === null) return fail(400, { message: 'Дозировка должна быть больше нуля.', values });

		try {
			await updateApplication(id, medId, dosage, user.subjectId);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Не удалось изменить дозировку.';
			return fail(400, { message, values });
		}

		return { success: true, message: 'Дозировка обновлена.' };
	},

	deleteApplication: async (event) => {
		const user = requireRole('admin', event);
		const { id } = event.params;
		if (!isValidBigIntString(id)) return fail(400, { message: 'Введите корректный идентификатор процедуры.' });

		const data = await event.request.formData();
		const medId = String(data.get('med_id') ?? '').trim();
		if (!isValidUuid(medId)) return fail(400, { message: 'Выберите препарат из каталога.' });

		try {
			await deleteApplication(id, medId, user.subjectId);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Не удалось убрать препарат.';
			return fail(400, { message });
		}

		return { success: true, message: 'Препарат убран из процедуры.' };
	},

	deleteProcedure: async (event) => {
		requireRole('admin', event);
		const { id } = event.params;
		if (!isValidBigIntString(id)) return fail(400, { message: 'Введите корректный идентификатор процедуры.' });

		try {
			await deleteProcedure(id);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Не удалось удалить процедуру.';
			return fail(400, { message });
		}

		redirect(303, '/admin/procedures');
	}
};
