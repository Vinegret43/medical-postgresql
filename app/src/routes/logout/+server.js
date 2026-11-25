import { redirect } from '@sveltejs/kit';
import { destroySession } from '#lib/server/auth.js';

/** Accessible from any role (or no role): /logout is not under a guarded prefix. */
async function logout({ cookies, setHeaders }) {
	await destroySession(cookies.get('sessionid'), cookies);
	setHeaders({ 'cache-control': 'no-store' });
	redirect(303, '/');
}

// GET makes `/logout` work as a plain link; POST keeps it usable from a form.
export const GET = logout;
export const POST = logout;
