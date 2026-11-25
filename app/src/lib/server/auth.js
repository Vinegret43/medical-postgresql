import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { error, fail, redirect } from '@sveltejs/kit';
import * as OTPAuth from 'otpauth';
import { AuthUser, Session } from './db.js';

export const ROLE_BY_PREFIX = {
	'/admin': 'admin',
	'/doc': 'doctor',
	'/patient': 'patient'
};

export const LOGIN_PATHS = {
	admin: '/admin/login',
	doctor: '/doc/login',
	patient: '/patient/login'
};

export const HOME_PATHS = {
	admin: '/admin',
	doctor: '/doc',
	patient: '/patient'
};

/** The route id, not the URL, decides which service is being requested. */
export function roleForRoute(routeId) {
	for (const [prefix, role] of Object.entries(ROLE_BY_PREFIX)) {
		if (routeId === prefix || routeId.startsWith(`${prefix}/`)) return role;
	}
	return null;
}

/**
 * Routes inside a guarded prefix that are deliberately reachable without a session.
 * Everything outside those prefixes (`/`, `/logout`, ...) is public by default
 * because `roleForRoute()` returns null for it.
 */
export function isRoleGuardExempt(routeId) {
	return Object.values(LOGIN_PATHS).includes(routeId);
}

/** Only local paths are accepted as post-login destinations. */
export function safeRedirectTarget(raw, role) {
	const fallback = HOME_PATHS[role] ?? '/';
	if (typeof raw !== 'string' || !raw.startsWith('/')) return fallback;

	try {
		const url = new URL(raw, 'https://local.invalid');
		if (url.origin !== 'https://local.invalid') return fallback;
		return url.pathname + url.search + url.hash;
	} catch {
		return fallback;
	}
}

/** Never let credential/password hash/TOTP secret reach a load function. */
export function toPublicUser(user) {
	if (!user) return null;
	return { id: user.id, role: user.role, subjectId: user.subjectId };
}

export function hashPassword(password) {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password, salt, 64).toString('hex');
	return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
	try {
		const [salt, key] = stored.split(':');
		const expected = Buffer.from(key, 'hex');
		const actual = scryptSync(password, salt, 64);
		return expected.length === actual.length && timingSafeEqual(expected, actual);
	} catch {
		return false;
	}
}

export function verifyTotp(token, secret) {
	if (!/^\d{6}$/.test(token)) return false;

	try {
		const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret) });
		return totp.validate({ token, window: 1 }) !== null;
	} catch {
		return false;
	}
}

/** `role` comes from the login route, never from a form field. */
export async function authenticate(role, identifier, secret) {
	if (typeof identifier !== 'string' || typeof secret !== 'string') return null;

	const subjectId = identifier.trim();
	if (!subjectId) return null;

	const user = await AuthUser.findOne({ where: { role, subjectId } });
	if (!user) return null;

	const ok = role === 'admin' ? verifyPassword(secret, user.credential) : verifyTotp(secret, user.credential);
	return ok ? user : null;
}

export async function createSession(user, cookies) {
	const token = randomBytes(32).toString('base64url');
	await Session.create({ token, userId: user.id });

	cookies.set('sessionid', token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax'
	});

	return token;
}

export async function getUserFromSession(token) {
	if (!token) return null;

	const session = await Session.findByPk(token);
	if (!session) return null;

	return AuthUser.findByPk(session.userId);
}

export async function destroySession(token, cookies) {
	if (token) await Session.destroy({ where: { token } });
	cookies.delete('sessionid', { path: '/' });
}

export async function loginAction(role, { request, cookies, url }) {
	const data = await request.formData();
	const identifier = String(data.get('identifier') ?? '');
	const secret = String(data.get('secret') ?? '');

	const user = await authenticate(role, identifier, secret);
	if (!user) return fail(400, { message: 'Invalid credentials' });

	await createSession(user, cookies);
	redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo'), role));
}

/** Shared guard for the handle hook and for per-page server loads. */
export function requireRole(role, { locals, url }) {
	if (!locals.user) {
		const target = url.pathname + url.search;
		redirect(303, `${LOGIN_PATHS[role]}?redirectTo=${encodeURIComponent(target)}`);
	}

	if (locals.user.role !== role) {
		error(403, `This section is only available to ${role} users`);
	}

	return locals.user;
}
