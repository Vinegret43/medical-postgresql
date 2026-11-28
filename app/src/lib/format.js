const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
	day: '2-digit',
	month: 'short',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	hour12: false,
	timeZone: 'UTC'
});

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

/** UTC formatting keeps SSR and client-rendered markup identical. */
export function formatDateTime(value) {
	const date = toDate(value);
	return date ? `${dateTimeFormatter.format(date)} UTC` : '—';
}

export function formatDate(value) {
	const date = toDate(value);
	return date ? dateFormatter.format(date) : '—';
}
