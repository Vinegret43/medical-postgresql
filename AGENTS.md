# Project instructions

This file is automatically loaded by OpenCode from the repository root. Keep it updated when the schema or auth flow changes. `CLAUDE.md` is only a fallback; use `AGENTS.md`.

This is a **study project**: a SvelteKit web app over a PostgreSQL database for an electronic medical service with three separate role-specific front ends (`/admin`, `/doc`, `/patient`).

## 0. Golden rules — read before touching anything

1. **Role is never client-supplied.** No role dropdown, hidden input, URL param, or header may decide the user's role. The role comes from the route (`/admin`, `/doc`, `/patient`) and from `auth_users.role` in the DB.
2. **Identity is never client-supplied.** Patient OMS, doctor license, and admin login used for DB queries must come from `event.locals.user.subjectId`, never from a form field or URL param.
3. **All auth decisions happen on the server.** Client-side checks are UX only and are not security.
4. **Use Sequelize for `auth_users` / `sessions`.** For medical data, use the `pg` pool to call the procedures/functions/views in `create_db.sql`. **Do not issue direct `INSERT`/`UPDATE`/`DELETE` against `pat_lfv21`, `doc_lfv21`, `admin_lfv21`, `proc_lfv21`, `meds_lfv21`, or `appl_lfv21`; use the existing procedures instead.** Do not mix these layers casually.
5. **Do not add extra session columns.** `sessions` is intentionally only `token -> user_id`. No `created_at`, `expires_at`, or `revoked` unless the user explicitly asks.
6. **Do not add extra user columns.** `auth_users` is intentionally minimal: `id`, `role`, `subject_id`, `credential`. No `created_at` / `is_active` without asking.
7. **Keep credentials out of the browser.** `toPublicUser()` strips `credential`. The root layout returns only `{ id, role, subjectId }`.
8. **Big IDs are strings.** OMS, license, and procedure IDs are `int8`. Never convert them to JS `Number`; use strings / BigInt-safe params.
9. **A protected route must cause a server request.** SvelteKit client-side navigation to a route with no server `load` skips `hooks.server.js`. Add a `+page.server.js` load, or preferably a per-role `+layout.server.js` guard.
10. **Wrong role → `error(403)`; anonymous → redirect to that role's login.** Never silently render another role's data.
11. **Do not silently rewrite the schema to work around SQL issues.** The old `pat_get_procedures` trailing-comma errors were fixed explicitly; if new issues appear, ask before changing `create_db.sql`.
12. **No `JOIN` or `WHERE` in application `pool.query` SELECTs.** Joins and filters belong in SQL functions/views in `create_db.sql`; app queries may only project columns and use `ORDER BY` / `LIMIT`. This applies to every medical-data SELECT, not just the doctor area.

## 1. Repository layout

```text
./
├── AGENTS.md                 <- this file
├── create_db.sql             <- base DB: tables, indexes, views, procedures, functions, triggers
├── create_auth.sql           <- auth tables, demo users, auth-sync triggers; run after create_db.sql
├── docs/
│   ├── report.typ            <- assignment/spec source (partly unfinished placeholder text)
│   └── report.pdf            <- generated PDF, ignored by git
└── app/                      <- SvelteKit app
    ├── .env                  <- local secrets; gitignored; contains placeholder DB password
    ├── .env.example          <- tracked template
    ├── jsconfig.json         <- JS project, strict: true
    ├── package.json          <- SvelteKit 3, Svelte 5, Vite 8, Sequelize, pg, otpauth
    ├── vite.config.js        <- tailwind + sveltekit; runes forced for project files
    ├── scripts/
    │   └── auth-tools.mjs    <- CLI: generate scrypt hash / current TOTP code
    └── src/
        ├── app.d.ts          <- type declaration for App.Locals.user (no runtime code)
        ├── app.html          <- app shell template
        ├── error.html        <- styled static error page (errors from hooks/fatal errors)
        ├── env.js            <- declares DATABASE_URL via defineEnvVars
        ├── hooks.server.js   <- resolves session cookie -> locals.user; guards role routes
        ├── lib/
        │   ├── server/
        │   │   ├── auth.js   <- login, password/TOTP verification, sessions, requireRole
        │   │   ├── config.js <- reads private DATABASE_URL, supplies local fallback
        │   │   └── db.js     <- Sequelize models + pg.Pool
        │   └── components/   <- shadcn/bits-ui components
        └── routes/
            ├── +page.svelte              <- public role picker
            ├── +layout.svelte            <- root layout
            ├── +layout.server.js         <- returns sanitized `user` to all pages
            ├── +error.svelte             <- styled in-app error page (load/navigation errors)
            ├── logout/+server.js         <- GET/POST logout: delete session row + cookie
            ├── admin/
            │   ├── +page.svelte
            │   ├── +page.server.js       <- calls requireRole('admin')
            │   └── login/{+page.svelte,+page.server.js}
            ├── doc/
            │   ├── +page.svelte
            │   ├── +page.server.js       <- calls requireRole('doctor')
            │   └── login/{+page.svelte,+page.server.js}
            └── patient/
                ├── +layout.server.js     <- guards subtree + loads patient for the top bar
                ├── +layout.svelte        <- shared top bar (home + profile badge)
                ├── +page.svelte/.server.js
                ├── profile/+page.svelte/.server.js
                ├── procedure/[id]/+page.svelte/.server.js
                └── login/{+page.svelte,+page.server.js}
```

### Import alias

`package.json` defines `#lib` and `#lib/*`, not `$lib`:

```js
import { requireRole } from '#lib/server/auth.js';
```

### Route map

| Route | Purpose | Guarded? |
|---|---|---|
| `/` | Public role picker | No |
| `/admin/login` | Admin login form + `default` action | No, intentionally public |
| `/doc/login` | Doctor login form + `default` action | No, intentionally public |
| `/patient/login` | Patient login form + `default` action | No, intentionally public |
| `/admin` and children | Admin service | Yes |
| `/doc` and children | Doctor service | Yes |
| `/patient` and children | Patient service (procedures, profile, procedure details) | Yes |
| `GET or POST /logout` | Clear session | No |

Login pages stay public even when logged in so a user can switch roles without logging out first. All three use shadcn components (`Card`, `Field`, `Input`, `Button`, and a destructive `Alert` for failures). Admin uses a password `Input`; doctor and patient use the shadcn `InputOTP` component (6 digits, digits-only pattern) bound to the `secret` field. The OTP component renders a hidden `<input name="secret">`, so the existing `loginAction()` server action needs no changes.

### Error pages

SvelteKit has two separate error renderers. Both are styled to look the same:

- `src/routes/+error.svelte` handles errors thrown from `load` functions and client-side navigation (for example the `404` from `get_procedure_medications`). Plain HTML with Tailwind tokens, no shadcn component imports — it is a lazily loaded chunk (~0.65 kB gzipped).
- `src/error.html` handles errors thrown from `hooks.server.js` before `resolve()` (the `403` from `requireRole`) and other fatal errors. Standalone HTML with inline CSS using the same design tokens; it cannot mount Svelte components.

Keep the markup, tokens, and "Back to home" link in sync between these two files.

## 2. Commands and setup

From the repository root:

```bash
psql -U postgres -f create_db.sql
psql -U postgres -f create_auth.sql
```

`create_db.sql` drops/recreates `medical_lfv21` and contains `\c medical_lfv21`, so use `psql`, not a generic SQL runner. `create_auth.sql` also switches to `medical_lfv21` and **drops/recreates** `auth_users` and `sessions`; rerunning it wipes active sessions.

App:

```bash
cd app
npm install
cp .env.example .env      # .env already exists locally; edit the password
npm run dev
npm run build
```

`app/.env` is gitignored. Do not commit it. Current local DB user is `postgres`; password is a placeholder to be filled in later.

Auth helper scripts:

```bash
cd app
node scripts/auth-tools.mjs hash <password>          # => salt:hexhash for auth_users.credential
node scripts/auth-tools.mjs totp <base32-secret>     # => current 6-digit code for demo login
```

SvelteKit 3 notes:

- `redirect(...)` throws internally; do **not** write `throw redirect(...)`.
- SvelteKit core signed cookies are gone; do not reintroduce `{ signed: true }`. Use the opaque token + DB lookup already implemented.
- Cookie defaults include `httpOnly: true`, `sameSite: 'lax'`, `secure` in production, and `path: '/'`; the code sets some of these explicitly for clarity.

## 3. Database structure

### 3.1 Base medical database (`create_db.sql`)

Database: `medical_lfv21`. Table prefixes (`pat_`, `doc_`, `admin_`) are naming conventions only; there are no PostgreSQL roles, grants, or RLS policies. Application code is the only enforcement layer.

#### Tables

| Table | PK | Columns / notes |
|---|---|---|
| `pat_lfv21` | `pat_oms_lfv21 int8` | `pat_fullname_lfv21 varchar(70)`, `pat_birthdate_lfv21 date`, `pat_phone_lfv21 varchar(15)`. Phone trigger requires `+7XXXXXXXXXX`. |
| `doc_lfv21` | `doc_license_lfv21 int8` | `doc_fullname_lfv21 varchar(70)`, `doc_birthdate_lfv21 date`, `doc_phone_lfv21 varchar(15)`. Same phone trigger. |
| `admin_lfv21` | `admin_login_lfv21 varchar(30)` | `admin_fullname_lfv21 varchar(70)`, `admin_birthdate_lfv21 date`, `admin_phone_lfv21 varchar(15)`. Same phone trigger. Admin accounts are managed manually; there is no `admin_create_admin` procedure. |
| `proc_lfv21` | `proc_id_lfv21 int8 GENERATED ALWAYS AS IDENTITY` | `pat_oms_lfv21` FK→patient `RESTRICT/CASCADE`; `doc_license_lfv21` FK→doctor `RESTRICT/CASCADE`; `proc_time_lfv21 timestamptz`; `proc_name_lfv21 varchar(200)`; nullable `proc_remarks_lfv21 text`, `proc_recommendations_lfv21 text`, `admin_login_lfv21 varchar(30)` FK→admin `SET NULL/CASCADE`, `admin_edit_timestamp_lfv21 timestamptz`. |
| `meds_lfv21` | `proc_meds_id_lfv21 uuid` | Manually supplied "честный знак" ID, not DB-generated. `proc_meds_name_lfv21 varchar(50)`, `proc_meds_method_lfv21 varchar(30)`. `(name, method)` is intentionally not unique. |
| `appl_lfv21` | composite `(proc_id_lfv21, proc_meds_id_lfv21)` | FK→`proc_lfv21` `CASCADE/RESTRICT`; FK→`meds_lfv21` `RESTRICT/RESTRICT`; `proc_meds_dosage_lfv21 float8 CHECK (> 0)`. |

Indexes: `idx_proc_pat_oms`, `idx_proc_doc_license`, `idx_proc_admin_login`, `idx_proc_time`, `idx_appl_med`. The composite PK already covers lookup by `proc_id`.

#### Views

Canonical unfiltered projections; the functions below add all joins/filters. Do not expose them directly through the patient role.

- `v_patients`
- `v_doctors`
- `v_meds`
- `v_procs`

#### Create procedures

- `admin_create_patient(p_oms, p_fullname, p_birthdate, p_phone)`
- `admin_create_doctor(p_license, p_fullname, p_birthdate, p_phone)`
- `admin_create_medication(p_id uuid, p_name, p_method)`
- `doc_create_proc(p_oms, p_license, p_name, p_remarks DEFAULT NULL, p_recommendations DEFAULT NULL, p_time DEFAULT NULL, INOUT p_proc_id DEFAULT NULL)` — uses `COALESCE(p_time, now())`; returns generated `proc_id` through `p_proc_id` for subsequent `appl` rows.
- `doc_create_appl(p_proc_id, p_med_id, p_dosage)`

#### Retrieve functions

There is one neutral API for all roles; no `pat_*` / `doc_*` duplicates. Optional filters are applied inside SQL.

- `get_patient(p_oms)` — one patient record; replaces the old `pat_get_patient` and `doc_get_patient`.
- `search_patients(p_query)` — up to 200 patients matching OMS substring or case-insensitive name; empty query returns all.
- `get_doctor(p_license)` — one doctor record.
- `get_medications()` — medication catalog, ordered by name/method/id.
- `get_procedures(p_pat_oms DEFAULT NULL, p_doc_license DEFAULT NULL)` — procedures with patient/doctor names joined in SQL; no arg = all, one arg = that patient's or that doctor's procedures. Replaces the old all/my/patient procedure functions.
- `get_procedure(p_proc_id, p_pat_oms DEFAULT NULL)` — one procedure with joined names. When `p_pat_oms` is passed, ownership is checked and `P0002` is raised for a foreign procedure.
- `get_procedure_medications(p_proc_id, p_pat_oms DEFAULT NULL)` — medications for a procedure. Reuses `get_procedure`'s ownership check when `p_pat_oms` is passed; procedures without medications return no rows.
- `count_procedures(p_pat_oms DEFAULT NULL, p_doc_license DEFAULT NULL)` — unified count.

#### Update/delete procedures

- Updates: `admin_update_patient`, `admin_update_doctor`, `admin_update_proc`, `admin_update_med`, `admin_update_appl`. Partial updates use `COALESCE`; missing rows raise `P0002`.
- Deletes: `admin_delete_patient`, `admin_delete_doctor`, `admin_delete_med`, `admin_delete_proc`, `admin_delete_appl`. Missing rows raise `P0002`. Patient/doctor/med deletes can be blocked by FK `RESTRICT`; procedure deletes cascade to applications.

#### Triggers

- `set_proc_edit_timestamp()` / `proc_edit_timestamp`: `BEFORE UPDATE ON proc_lfv21`, sets `admin_edit_timestamp_lfv21 = now()`.
- `validate_phone()` / `pat_phone_check`, `doc_phone_check`, `admin_phone_check`: `BEFORE INSERT OR UPDATE`, requires `+7` plus exactly 10 digits; otherwise raises `23514`.

### 3.2 Authentication database (`create_auth.sql`)

#### `auth_users`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `role` | `varchar(20)` NOT NULL | `CHECK (role IN ('admin','doctor','patient'))` |
| `subject_id` | `varchar(30)` NOT NULL | Polymorphic: OMS for patient, license for doctor, login for admin. `UNIQUE (role, subject_id)`. No FK by design. |
| `credential` | `text` NOT NULL | Admin: scrypt `salt:hexhash`. Doctor/patient: base32 TOTP secret. |

#### `sessions`

| Column | Type | Notes |
|---|---|---|
| `token` | `varchar(64)` PK | Opaque random `base64url` token from `randomBytes(32)`. Stored raw on purpose: "token → user_id". |
| `user_id` | `uuid` NOT NULL | FK→`auth_users(id) ON DELETE CASCADE`. |

No timestamps, expiry, or revoked flag. Cookie `maxAge` is 7 days browser-side only; the DB row lives until logout/deletion. Do not "improve" this without asking.

#### Auth-sync triggers

`subject_id` cannot be a real FK because it points to one of three tables depending on role. These triggers keep it consistent:

- `auth_subject_on_delete()` — `BEFORE DELETE` on `pat_lfv21`, `doc_lfv21`, `admin_lfv21`; deletes matching `auth_users` row (which cascades sessions).
- `auth_subject_on_update()` — `AFTER UPDATE`; updates `auth_users.subject_id` when the subject PK changes.

Trigger names: `pat_auth_delete/update`, `doc_auth_delete/update`, `admin_auth_delete/update`.

#### Demo users

| Role | Subject | Credential |
|---|---|---|
| admin | `admin` | password `admin123` |
| doctor | `1000000001` | TOTP secret `JBSWY3DPEHPK3PXP` |
| patient | `2000000001` | TOTP secret `GEZDGNBVGY3TQOJQ` |

`create_db.sql` now seeds demo base rows for the patient (OMS `2000000001`) and doctor (license `1000000001`), three procedures and three medications, all via the existing procedures. There is still no seeded `admin_lfv21` row; admins are managed manually. Re-running `create_db.sql` drops and recreates the database (and the demo data).

### 3.3 Row-level authorization rule to copy

`get_procedure(p_proc_id int8, p_pat_oms int8 DEFAULT NULL)` holds the only ownership check:

```sql
IF p_pat_oms IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM proc_lfv21 AS pr
    WHERE pr.proc_id_lfv21 = p_proc_id
      AND pr.pat_oms_lfv21 = p_pat_oms
) THEN
    RAISE EXCEPTION 'procedure % is not available for OMS %', p_proc_id, p_pat_oms
        USING ERRCODE = 'P0002';
END IF;
```

`get_procedure_medications(..., p_pat_oms)` calls `get_procedure` to reuse it. Listing routes use `get_procedures(p_pat_oms => ...)`, so filtering is also done in SQL; patient pages project only the safe columns.

It raises `P0002` instead of returning an empty set. This is still a caller-supplied parameter check, not real RLS; the application must pass the authenticated OMS from `locals.user.subjectId`. Any caller passing another OMS is treated as authorized.

### 3.4 Known issues / cautions

- The old `pat_get_procedures` had trailing commas in `RETURNS TABLE` and `SELECT`; `get_procedures` must not reintroduce them.
- `docs/report.typ` still has `#lorem(...)` placeholders and empty sections; do not infer unwritten requirements from it.
- Patient pages must never display `admin_login` or `admin_edit_timestamp`. They use `get_procedures(p_pat_oms => ...)` / `get_procedure(..., p_pat_oms)` and project only safe columns.
- The views are unfiltered; never expose them directly through `/patient`.
- No DB-level auth/RLS exists. Route guards + trusted session data are the entire boundary.

## 4. Authentication architecture

### 4.1 Source of truth

`src/hooks.server.js` runs on every **server** request:

```js
const user = await getUserFromSession(event.cookies.get('sessionid'));
event.locals.user = toPublicUser(user);
```

`getUserFromSession()` looks up `sessions.token`, then loads `auth_users` by `sessions.user_id`. The role comes from the DB row, not from the cookie.

`requireRole(role, event)` then:

- no `locals.user` → `redirect(303, <role login>?redirectTo=<validated local path>)`
- `locals.user.role !== role` → `error(403, ...)`
- otherwise returns the user.

`ROLE_BY_PREFIX`, `LOGIN_PATHS`, and `HOME_PATHS` in `auth.js` define the mapping:

```text
/admin   -> admin
/doc     -> doctor
/patient -> patient
```

`isRoleGuardExempt()` exempts only the three exact login route ids. Routes outside the guarded prefixes (`/`, `/logout`, ...) are public by default because `roleForRoute(routeId)` returns null for them. Nested routes like `/admin/reports` are protected because `roleForRoute(routeId)` matches the prefix.

### 4.2 The client-navigation trap

`<Button href="/admin">` renders an `<a>`, so SvelteKit may navigate client-side. If the destination has no server `load`/action, no HTTP request is made and `handle` never runs.

Therefore, for every protected subtree:

- **Preferred:** add `src/routes/admin/+layout.server.js`, `src/routes/doc/+layout.server.js`, `src/routes/patient/+layout.server.js`, each calling `requireRole(...)`. This covers all descendants.
- **Minimum:** ensure each protected `+page.server.js` has a `load` that calls `requireRole(...)` (current top-level pages do this).

Do not rely on a `.svelte` file to guard anything.

### 4.3 Login actions

Each login route binds its role in server code:

```js
export const actions = {
	default: (event) => loginAction('admin', event)
};
```

`loginAction()`:

1. reads `identifier` and `secret` from `request.formData()`;
2. calls `authenticate(role, identifier, secret)` — admin uses `verifyPassword`, doctor/patient use `verifyTotp`;
3. failure → `fail(400, { message: 'Invalid credentials' })`;
4. success → `createSession()` inserts into `sessions` and sets the `sessionid` cookie;
5. `redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo'), role))`.

Never let a form field choose `role`. Never redirect to a raw `redirectTo`; `safeRedirectTarget()` rejects external and protocol-relative URLs.

### 4.4 Accessing the current user in routes

Server-side, preferred:

```js
// src/routes/patient/records/+page.server.js
export function load(event) {
	const user = requireRole('patient', event); // non-null after guard
	const oms = user.subjectId;                 // string, from the session

	return { oms };
}
```

If a per-role layout already guards:

```js
export function load({ locals }) {
	return { oms: locals.user.subjectId };
}
```

In a form/action:

```js
export async function action({ locals, request }) {
	const oms = locals.user.subjectId;
	// pass `oms` to a pg procedure; never read it from request.formData()
}
```

In Svelte components (root layout already returns `user`):

```svelte
<script>
	import { page } from '$app/state';
	let oms = $derived(page.data.user?.subjectId);
</script>
```

`locals.user` is always `{ id, role, subjectId } | null`. It never contains `credential`.

### 4.5 Adding a new protected subroute — checklist

1. Put it under `/admin/...`, `/doc/...`, or `/patient/...` so `roleForRoute()` classifies it.
2. Ensure the subtree has a server guard: add/keep the role `+layout.server.js`, or give the page a `+page.server.js` `load` calling `requireRole(...)`.
3. Add `+page.server.js` for DB data; pass `locals.user.subjectId` to procedures/functions.
4. For patient data, pass the session OMS to `get_procedures` / `get_procedure` / `get_procedure_medications` so filtering and ownership checks happen in SQL. Do not accept OMS from the URL or form.
5. Do not add client-side role checks as the security boundary.
6. Do not touch the existing landing `.svelte` files unless explicitly asked.

### 4.6 Session/cookie rules

- Cookie name: `sessionid`; value: opaque random token. Do not put role, OMS, license, or secret in it.
- `sessions` is the revocation mechanism: deleting a row kills that session. `GET or POST /logout` deletes both the row and the cookie.
- Keep `httpOnly`, `sameSite: 'lax'`, and production `secure`. Do not make the cookie readable by JS.
- `maxAge: 604800` (7 days) is browser lifetime only; there is no DB expiry by design.
- `hashPassword()` uses `scrypt` with a random 16-byte hex salt and stores `salt:hash`; `verifyPassword()` uses `timingSafeEqual`.
- `verifyTotp()` uses `otpauth` with `window: 1` (accepts codes one step before/after).

## 5. Verification checklist

Before declaring auth work done:

```bash
cd app && npm run build
```

Then manually verify:

- Anonymous `/admin`, `/doc`, `/patient` → redirect to the matching login with a local `redirectTo`.
- Correct login → lands on the role home; cookie set; `sessions` row created.
- Logged-in admin visiting `/doc` (or a child route) → `403`.
- Logged-in patient visiting `/patient/...` → data queried with the session OMS, not a URL param.
- Client-side navigation into a protected child route still hits the server (check dev-server request/log).
- `GET or POST /logout` removes the cookie and the `sessions` row.
- Invalid credentials show `Invalid credentials` and do not create a session.
- `redirectTo=https://evil...` and `//evil...` both fall back to the role home.
