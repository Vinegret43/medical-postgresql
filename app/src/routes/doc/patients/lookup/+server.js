import { json } from '@sveltejs/kit';
import { requireRole } from '#lib/server/auth.js';
import { getPatient } from '#lib/server/doc.js';

/** Small JSON endpoint used by the new-procedure form for live OMS preview. */
export async function GET(event) {
	requireRole('doctor', event);

	const oms = String(event.url.searchParams.get('oms') ?? '').trim();
	if (!/^\d{1,19}$/.test(oms)) {
		return json({ found: false, reason: 'invalid' });
	}

	const patient = await getPatient(oms);
	if (!patient) {
		return json({ found: false, reason: 'missing' });
	}

	return json({ found: true, oms: patient.oms, fullname: patient.fullname });
}
