import { loginAction } from '#lib/server/auth.js';

export const actions = {
	default: (event) => loginAction('patient', event)
};
