import {
	getUserFromSession,
	isPublicRoute,
	requireRole,
	roleForRoute,
	toPublicUser
} from '#lib/server/auth.js';

export async function handle({ event, resolve }) {
	const user = await getUserFromSession(event.cookies.get('sessionid'));
	event.locals.user = toPublicUser(user);

	const routeId = event.route.id ?? '';
	const role = roleForRoute(routeId);

	if (role && !isPublicRoute(routeId)) requireRole(role, event);

	return resolve(event);
}
