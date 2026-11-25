// src/routes/login/+page.server.ts (simplified example)
import { redirect } from '@sveltejs/kit';

export const actions = {
  default: async ({ request, cookies, url }) => {
    const data = await request.formData();
    // ... validate username and password
    cookies.set('sessionid', 'generated-session', { path: '/' });

    const redirectTo = url.searchParams.get('redirectTo') || '/';
    redirect(303, decodeURIComponent(redirectTo));
  }
};
