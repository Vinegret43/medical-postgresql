import { APP_TIME_ZONE } from '#lib/timezone.js';

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
	day: '2-digit',
	month: 'short',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	hour12: false,
	timeZone: APP_TIME_ZONE
});

// Date-only values are parsed at UTC midnight, so keep this formatter on UTC
// to avoid shifting a birthday by a day.
const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
	day: '2-digit',
	month: 'long',
	year: 'numeric',
	timeZone: 'UTC'
});

function toDate(value) {
	if (!value) return null;
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

/** A single fixed zone keeps SSR and client-rendered markup identical. */
export function formatDateTime(value) {
	const date = toDate(value);
	return date ? `${dateTimeFormatter.format(date)} МСК` : '—';
}

export function formatDate(value) {
	const date = toDate(value);
	return date ? dateFormatter.format(date) : '—';
}
