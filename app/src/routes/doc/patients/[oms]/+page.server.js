import { error } from '@sveltejs/kit';
import { requireRole } from '#lib/server/auth.js';
import { getPatient, getPatientProcedures } from '#lib/server/doc.js';

export async function load(event) {
	requireRole('doctor', event);
	const { oms } = event.params;

	if (!/^\d{1,19}$/.test(oms)) error(400, 'Invalid OMS policy number');

	const patient = await getPatient(oms);
	if (!patient) error(404, 'Patient not found');

	return { patient, procedures: await getPatientProcedures(oms) };
}
