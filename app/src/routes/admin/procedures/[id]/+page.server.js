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
		if (!value || value.length > 200) return { message: 'Name is required and must be at most 200 characters.' };
		return { value };
	}
	if (field === 'proc_time') {
		if (!isValidDateTimeLocal(value)) return { message: 'Enter a valid procedure time.' };
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

	if (!isValidBigIntString(id)) error(400, 'Invalid procedure ID');

	try {
		const procedure = await getProcedure(id);
		if (!procedure) error(404, 'Procedure not found');

		return {
			procedure,
			applications: await getProcedureMedications(id),
			medications: await getMedications()
		};
	} catch (err) {
		if (isNotFound(err)) error(404, 'Procedure not found');
		throw err;
	}
}

export const actions = {
	updateField: async (event) => {
		const user = requireRole('admin', event);
		const { id } = event.params;
		if (!isValidBigIntString(id)) return fail(400, { message: 'Enter a valid procedure ID.' });

		const data = await event.request.formData();
		const field = String(data.get('field') ?? '');
		const raw = String(data.get('value') ?? '');
		const values = { [field]: raw };

		if (!FIELDS.has(field)) {
			return fail(400, { message: 'Unknown procedure field.', field, values });
		}

		const result = validateProcedureField(field, raw);
		if (result.message) return fail(400, { message: result.message, field, values });

		try {
			await updateProcedure(id, { [field]: result.value }, user.subjectId);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Could not update the procedure.';
			return fail(400, { message, field, values });
		}

		return { success: true, field };
	},

	addApplication: async (event) => {
		const user = requireRole('admin', event);
		const { id } = event.params;
		if (!isValidBigIntString(id)) return fail(400, { message: 'Enter a valid procedure ID.' });

		const data = await event.request.formData();
		const medId = String(data.get('med_id') ?? '').trim();
		const dosageRaw = String(data.get('dosage') ?? '').trim();
		const values = { med_id: medId, dosage: dosageRaw };

		if (!isValidUuid(medId)) return fail(400, { message: 'Select a medication from the catalog.', values });

		const dosage = parseDosage(dosageRaw);
		if (dosage === null) return fail(400, { message: 'Dosage must be greater than zero.', values });

		const medication = await getMedication(medId);
		if (!medication) return fail(400, { message: 'Select a medication from the catalog.', values });

		try {
			await addApplication(id, medId, dosage, user.subjectId);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Could not add the medication.';
			return fail(400, { message, values });
		}

		return { success: true, message: 'Medication added to the procedure.' };
	},

	updateApplication: async (event) => {
		const user = requireRole('admin', event);
		const { id } = event.params;
		if (!isValidBigIntString(id)) return fail(400, { message: 'Enter a valid procedure ID.' });

		const data = await event.request.formData();
		const medId = String(data.get('med_id') ?? '').trim();
		const dosageRaw = String(data.get('dosage') ?? '').trim();
		const values = { med_id: medId, dosage: dosageRaw };

		if (!isValidUuid(medId)) return fail(400, { message: 'Select a medication from the catalog.', values });

		const dosage = parseDosage(dosageRaw);
		if (dosage === null) return fail(400, { message: 'Dosage must be greater than zero.', values });

		try {
			await updateApplication(id, medId, dosage, user.subjectId);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Could not update the dosage.';
			return fail(400, { message, values });
		}

		return { success: true, message: 'Dosage updated.' };
	},

	deleteApplication: async (event) => {
		const user = requireRole('admin', event);
		const { id } = event.params;
		if (!isValidBigIntString(id)) return fail(400, { message: 'Enter a valid procedure ID.' });

		const data = await event.request.formData();
		const medId = String(data.get('med_id') ?? '').trim();
		if (!isValidUuid(medId)) return fail(400, { message: 'Select a medication from the catalog.' });

		try {
			await deleteApplication(id, medId, user.subjectId);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Could not remove the medication.';
			return fail(400, { message });
		}

		return { success: true, message: 'Medication removed from the procedure.' };
	},

	deleteProcedure: async (event) => {
		requireRole('admin', event);
		const { id } = event.params;
		if (!isValidBigIntString(id)) return fail(400, { message: 'Enter a valid procedure ID.' });

		try {
			await deleteProcedure(id);
		} catch (err) {
			const message = err instanceof AdminError ? err.message : 'Could not delete the procedure.';
			return fail(400, { message });
		}

		redirect(303, '/admin/procedures');
	}
};
