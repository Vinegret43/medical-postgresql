// src/hooks.server.ts
import { redirect } from '@sveltejs/kit';

export async function handle({ event, resolve }) {
  // Assume you have retrieved user information from cookie or session
  const session = event.cookies.get('sessionid');
  const user = session ? await getUserFromSession(session) : null;
  event.locals.user = user; // Store for use in subsequent load functions

  // Key point: Use event.route.id instead of event.url.pathname
  // route.id is the route actually matched by the SvelteKit router and will not be bypassed by encoded URLs
  const routeId = event.route.id ?? '';

  // If the route starts with /admin and the user is not logged in, redirect to the login page
  if (routeId.startsWith('/admin') && !user) {
    // Carry the original path so you can jump back after successful login
    const redirectTo = encodeURIComponent(event.url.pathname + event.url.search);
    redirect(303, `/admin/login?redirectTo=${redirectTo}`);
  }

  return resolve(event);
};
