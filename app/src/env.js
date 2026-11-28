import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Строка подключения к базе данных медицинского сервиса PostgreSQL'
	}
});
