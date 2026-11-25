import { DATABASE_URL } from '$app/env/private';

export const databaseUrl =
	DATABASE_URL ?? 'postgresql://postgres:CHANGE_ME@localhost:5432/medical_lfv21';
