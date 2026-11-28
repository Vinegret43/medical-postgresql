/**
 * One fixed zone for the whole app, including SSR, so the server and the
 * browser render exactly the same wall-clock time.
 */
export const APP_TIME_ZONE = 'Europe/Moscow';

const DATE_TIME_LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
	timeZone: APP_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	hour12: false,
	hourCycle: 'h23'
});

function zonedParts(date) {
	const parts = {};
	for (const part of partsFormatter.formatToParts(date)) {
		if (part.type !== 'literal') parts[part.type] = part.value;
	}
	return parts;
}

function partsToUtcMillis(parts) {
	return Date.UTC(
		Number(parts.year),
		Number(parts.month) - 1,
		Number(parts.day),
		Number(parts.hour),
		Number(parts.minute)
	);
}

/** Instant -> wall-clock value expected by `<input type="datetime-local">`. */
export function toDateTimeLocal(value) {
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	const { year, month, day, hour, minute } = zonedParts(date);
	return `${year}-${month}-${day}T${hour}:${minute}`;
}

/** Wall-clock datetime-local value -> ISO instant interpreted in APP_TIME_ZONE. */
export function dateTimeLocalToIso(value) {
	const match = DATE_TIME_LOCAL_RE.exec(String(value ?? '').trim());
	if (!match) return null;

	const [, year, month, day, hour, minute] = match;
	const wallAsUtc = Date.UTC(+year, +month - 1, +day, +hour, +minute);
	if (Number.isNaN(wallAsUtc)) return null;

	const offset = partsToUtcMillis(zonedParts(new Date(wallAsUtc))) - wallAsUtc;
	const instant = new Date(wallAsUtc - offset);
	const wall = `${year}-${month}-${day}T${hour}:${minute}`;

	// The round trip rejects normalized invalid dates (e.g. 30 February) and
	// nonexistent local times in zones with DST gaps. Moscow has no DST.
	return toDateTimeLocal(instant) === wall ? instant.toISOString() : null;
}
