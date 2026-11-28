import { fail, redirect } from '@sveltejs/kit';
import { requireRole } from '#lib/server/auth.js';
import {
	createProcedureWithMedications,
	getMedications,
	getPatient
} from '#lib/server/doc.js';

const OMS_RE = /^\d{1,19}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATETIME_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function toDateTimeLocal(date) {
	const pad = (value) => String(value).padStart(2, '0');
	return (
		`${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
		`T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
	);
}

export async function load(event) {
	requireRole('doctor', event);

	const rawOms = String(event.url.searchParams.get('oms') ?? '').trim();
	const oms = OMS_RE.test(rawOms) ? rawOms : '';
	const patient = oms ? await getPatient(oms) : null;
	const openedAt = new Date();

	let omsError = null;
	if (rawOms && !patient) {
		omsError = OMS_RE.test(rawOms)
			? 'Пациент с таким номером полиса ОМС не найден.'
			: 'Номер ОМС должен содержать только цифры.';
	}

	return {
		medications: await getMedications(),
		initialOms: oms,
		patient: patient ? { oms: patient.oms, fullname: patient.fullname } : null,
		omsError,
		openedAt: openedAt.toISOString(),
		openedAtLocal: toDateTimeLocal(openedAt)
	};
}

export const actions = {
	default: async (event) => {
		const user = requireRole('doctor', event);
		const data = await event.request.formData();

		const oms = String(data.get('oms') ?? '').trim();
		const procName = String(data.get('proc_name') ?? '').trim();
		const remarks = String(data.get('remarks') ?? '').trim();
		const recommendations = String(data.get('recommendations') ?? '').trim();
		const procTimeRaw = String(data.get('proc_time') ?? '').trim();

		const values = {
			oms,
			proc_name: procName,
			remarks,
			recommendations,
			proc_time: procTimeRaw,
			medications: []
		};

		if (!OMS_RE.test(oms)) {
			return fail(400, { message: 'Введите корректный номер полиса ОМС.', values });
		}

		const patient = await getPatient(oms);
		if (!patient) {
			return fail(400, { message: 'Пациент с таким номером полиса ОМС не найден.', values });
		}

		const patientPreview = { oms: patient.oms, fullname: patient.fullname };
		const invalid = (message) => fail(400, { message, values, patient: patientPreview });

		if (!procName || procName.length > 200) {
			return invalid('Название процедуры обязательно и не должно превышать 200 символов.');
		}

		let procTime = null;
		if (procTimeRaw) {
			if (!DATETIME_LOCAL_RE.test(procTimeRaw)) {
				return invalid('Введите корректное время процедуры.');
			}
			const parsed = new Date(`${procTimeRaw}Z`);
			if (Number.isNaN(parsed.getTime())) {
				return invalid('Введите корректное время процедуры.');
			}
			procTime = parsed.toISOString();
		}

		const catalog = await getMedications();
		const catalogById = new Map(catalog.map((medication) => [medication.id, medication]));
		const medIds = data.getAll('med_id').map((value) => String(value).trim());
		const dosages = data.getAll('dosage').map((value) => String(value).trim());

		if (medIds.length !== dosages.length) {
			return invalid('Данные о препаратах неполные.');
		}

		const merged = new Map();
		for (let index = 0; index < medIds.length; index += 1) {
			const medId = medIds[index];
			const dosageRaw = dosages[index];

			if (!medId && !dosageRaw) continue;

			if (!UUID_RE.test(medId) || !catalogById.has(medId)) {
				return invalid('Выберите препарат из каталога.');
			}

			const dosage = Number(dosageRaw);
			if (!Number.isFinite(dosage) || dosage <= 0) {
				return invalid('Для каждого препарата нужна дозировка больше нуля.');
			}

			merged.set(medId, (merged.get(medId) ?? 0) + dosage);
		}

		values.medications = [...merged].map(([id, dosage]) => {
			const medication = catalogById.get(id);
			return { id, name: medication.name, method: medication.method, dosage };
		});

		let procId;
		try {
			procId = await createProcedureWithMedications({
				oms,
				license: user.subjectId,
				name: procName,
				remarks,
				recommendations,
				procTime,
				medications: values.medications
			});
		} catch (err) {
			console.error('Не удалось создать процедуру', err);
			return fail(500, {
				message: 'Не удалось сохранить процедуру. Частичная запись не сохранена.',
				values,
				patient: patientPreview
			});
		}

		redirect(303, `/doc/procedure/${procId}`);
	}
};
