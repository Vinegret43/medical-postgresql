# Admin sub-service specification

Status: **approved plan, not yet implemented**.

This is the detailed source of truth for the `/admin` CRUD sub-service. `AGENTS.md` keeps only the narrow rule exceptions; do not duplicate this whole document there.

## 1. Scope

The admin must be able to:

- Medications: view, add, delete, edit.
- Patients: view, add, delete, edit, view TOTP secret, regenerate TOTP secret.
- Doctors: view, add, delete, edit, view TOTP secret, regenerate TOTP secret.
- Procedures: view, delete, edit only `proc_name`, `proc_time`, `remarks`, `recommendations`, and applications. Admin must not add procedures or change the patient/doctor attached to a procedure.
- Applications: view, add, remove, edit dosage.

Out of scope:

- Adding procedures.
- Managing admin accounts (there is no `admin_create_admin` procedure).
- Medication inventory tracking.
- Procedure text search for now.
- Editing OMS, license, medication UUID, or a procedure's patient/doctor assignment.

## 2. Resolved decisions and exceptions

### 2.1 Caller identity vs target resource ID

This was the “exception” in question 1. It does **not** mean a client may choose an identity.

- On `/patient/...` and `/doc/...`, the OMS/license is the signed-in caller: it must come only from `event.locals.user.subjectId`.
- On `/admin/patients/2000000001`, the OMS is the **record the admin is looking at**. The admin is not that patient, so the value necessarily comes from the validated route param `[oms]`. The same applies to `[license]` and `[id]` (medication UUID).
- These target IDs are resource keys, not authentication claims. They never change `locals.user`, never choose a role, and never grant access by themselves.
- The admin's own login, used for `admin_login` audit fields, still comes only from `locals.user.subjectId`.

`AGENTS.md` rule 2 now documents this.

### 2.2 TOTP secret access

- Admin's own credential is never sent to the browser.
- Admin patient/doctor detail pages may send the **target's** TOTP secret because the admin must be able to hand it to the real patient/doctor.
- Display: masked by default, with explicit “Reveal” and a QR code for enrollment.
- Regenerating a secret deletes that target user's `sessions` rows, so old sessions cannot keep working after the secret changes.
- Secrets must not appear in root layout data, cookies, URLs, or logs.

`AGENTS.md` rules 4 and 7 now document the atomic-create and target-secret exceptions.

### 2.3 Atomic patient/doctor creation

Creating a patient/doctor also creates an `auth_users` row with a freshly generated base32 TOTP secret.

This is implemented in the application layer in one `sequelize.transaction()`:

1. Call the existing medical create procedure via `sequelize.query('CALL ...', { transaction })`.
2. Create the `AuthUser` on the same transaction.
3. Commit both or roll back both.

This is a narrow exception to the usual “medical data via `pg` pool” rule, made explicitly to get one real transaction. All other admin medical reads/writes keep using the `pg` pool and existing procedures/functions. No direct DML against medical tables is ever allowed.

### 2.4 Confirmed answers

| Topic | Decision |
|---|---|
| Admin target IDs | Allowed from validated route params; documented in `AGENTS.md` |
| View target TOTP secret | Yes, masked + Reveal + QR |
| Change `admin_update_proc` | Yes: add `p_time`; `admin_login` from session |
| Create auth user with patient/doctor | Yes, automatically, in one app-layer transaction |
| Doctor search | Add `search_doctors(p_query)` like `search_patients` |
| FK delete errors | Translate to friendly messages |
| Procedure patient/doctor reassignment | Forbidden |
| Application add/edit/remove audit | Update `admin_login`; trigger updates timestamp |
| Procedure text search | Not now |
| Medication UUID | Manual entry only |
| Duplicate application | Reject; tell admin to edit dosage instead |
| Regenerate TOTP | Yes, revoke target's sessions |
| Immutable IDs | OMS, license, med UUID immutable |

## 3. URL structure and files

Use a per-role layout guard. `/admin/login` remains public and header-exempt.

```text
app/src/routes/admin/
├── +layout.server.js                 # requireRole('admin') for the whole subtree
├── +layout.svelte                    # admin top bar/nav, same visual language as /doc
├── +page.svelte                      # dashboard / links
├── +page.server.js                   # optional: can be removed once layout guard exists
├── login/{+page.svelte,+page.server.js}  # existing
│
├── patients/
│   ├── +page.svelte                   # list + ?q= search + New patient
│   ├── +page.server.js                # load: searchPatients(q); action: none
│   ├── new/+page.svelte               # create form
│   ├── new/+page.server.js            # default action: createPatientWithAuth
│   └── [oms]/+page.svelte             # detail: fields, TOTP, procedures, delete
│       └── +page.server.js            # load + updateField/delete/regenerateTotp
│
├── doctors/
│   ├── +page.svelte                   # list + ?q= search + New doctor
│   ├── +page.server.js                # load: searchDoctors(q)
│   ├── new/+page.svelte               # create form
│   ├── new/+page.server.js            # default action: createDoctorWithAuth
│   └── [license]/+page.svelte         # detail: fields, TOTP, procedures, delete
│       └── +page.server.js            # load + updateField/delete/regenerateTotp
│
├── meds/
│   ├── +page.svelte                   # list all medications + New medication
│   ├── +page.server.js                # load: getMedications()
│   ├── new/+page.svelte               # UUID + name + method
│   ├── new/+page.server.js            # default action: createMedication
│   └── [id]/+page.svelte              # detail: inline fields + delete
│       └── +page.server.js            # load + updateField/delete
│
└── procedures/
    ├── +page.svelte                   # all procedures, ordered by time desc; delete
    ├── +page.server.js                # load + delete
    └── [id]/
        ├── +page.svelte               # detail + applications table + quick inline edits
        ├── +page.server.js            # load + updateField/addApplication/updateApplication/deleteApplication/deleteProcedure
        └── edit/+page.svelte          # canonical multi-field edit form
            └── +page.server.js        # load + default action
```

`hooks.server.js` already classifies everything under `/admin` as `admin`; the layout guard makes client-side navigation hit the server.

## 4. JSON APIs

No new `+server.js` endpoints are needed.

| Need | Mechanism |
|---|---|
| Patient/doctor search | `?q=` + debounced `goto()`, same pattern as `/doc/patients` |
| Medication/procedure lists | page `load` |
| All creates/edits/deletes | named form actions |
| TOTP reveal | page data + client-only reveal |
| TOTP regenerate | form action returns `{ secret, uri, qrDataUrl }` via `form` |
| Medication picker | `data.medications` from procedure detail load |
| QR code | generated server-side into a data URL |

## 5. Server/data layer

### 5.1 New helper modules

Create `app/src/lib/server/admin.js`:

- Medical reads/writes through existing SQL functions/procedures via `pool`.
- Auth writes through Sequelize.
- Friendly error mapping from Postgres codes.

Suggested exports:

```js
// patients
searchPatients(q), getPatient(oms), updatePatient(oms, fields), deletePatient(oms),
createPatientWithAuth({ oms, fullname, birthdate, phone })

// doctors
searchDoctors(q), getDoctor(license), updateDoctor(license, fields), deleteDoctor(license),
createDoctorWithAuth({ license, fullname, birthdate, phone })

// meds
getMedications(), getMedication(id), createMedication({ id, name, method }),
updateMedication(id, fields), deleteMedication(id)

// procedures
getAllProcedures(), getProcedure(id), updateProcedure(id, fields, adminLogin),
deleteProcedure(id), getProcedureMedications(id)

// applications
addApplication(procId, medId, dosage, adminLogin),
updateApplication(procId, medId, dosage, adminLogin),
deleteApplication(procId, medId, adminLogin)

// auth/TOTP
getTotpHandoff(role, subjectId), regenerateTotpSecret(role, subjectId)
```

`getTotpHandoff()` returns:

```js
{
  secret,      // base32, masked in UI by default
  uri,         // otpauth://totp/Medical%20Service:<role>:<subject>?...
  qrDataUrl    // PNG data URL
}
```

Use `otpauth` defaults explicitly in the URI: SHA1, 6 digits, 30 seconds. Add the `qrcode` npm dependency for server-side PNG generation.

`regenerateTotpSecret()` must:

1. Find `AuthUser` by `role` + `subjectId`.
2. If missing, create it (covers legacy rows).
3. Set a new base32 secret.
4. Delete all `Session` rows for that user.
5. Return the fresh handoff object.

### 5.2 SQL changes in `create_db.sql`

DB rebuild is acceptable. Run both scripts as usual.

Add doctor search:

```sql
CREATE FUNCTION search_doctors(p_query varchar)
RETURNS TABLE (license int8, fullname varchar(70), birthdate date, phone varchar(15))
-- same shape as search_patients: empty query = all,
-- OMS/license substring or case-insensitive name, ORDER BY fullname, license, LIMIT 200.
```

Add single-med lookup for the detail page:

```sql
CREATE FUNCTION get_medication(p_id uuid)
RETURNS TABLE (id uuid, name varchar(50), method varchar(30))
-- projection from v_meds only; filter lives inside SQL.
```

Replace `admin_update_proc` with a full-field update that includes time:

```sql
CREATE PROCEDURE admin_update_proc(
    IN p_proc_id int8,
    IN p_name varchar(200),
    IN p_remarks text,
    IN p_recommendations text,
    IN p_time timestamptz,
    IN p_admin_login varchar(30)
)
```

- The edit page submits all four editable fields.
- Server converts empty `remarks` / `recommendations` to `NULL`.
- `p_admin_login` comes from `locals.user.subjectId`.
- Do **not** pass `admin_edit_timestamp`; `proc_edit_timestamp` sets it.

Add a touch procedure so application edits are attributed to the admin:

```sql
CREATE PROCEDURE admin_touch_proc(IN p_proc_id int8, IN p_admin_login varchar(30))
-- UPDATE proc_lfv21 SET admin_login_lfv21 = p_admin_login WHERE proc_id_lfv21 = p_proc_id;
-- trigger updates admin_edit_timestamp_lfv21; raise P0002 if missing.
```

Application add/edit/remove runs the existing application procedure plus `admin_touch_proc` in one `pg` client transaction.

No changes to `auth_users`, `sessions`, `create_auth.sql`, or the existing auth-sync triggers.

## 6. UI and editing interface

### 6.1 Custom components

Put app-specific components under `app/src/lib/components/admin/`, not under `components/ui/`:

- `InlineEdit.svelte`
- `ConfirmDelete.svelte`
- optionally `TotpCard.svelte`

`InlineEdit.svelte` props:

```js
{
  label,
  name,
  value,
  type = 'text',        // text | date | datetime-local | number | textarea
  action = '?/updateField',
  hidden = {},          // target resource key + field name, added by server-safe page markup
  required = false,
  nullable = false,
  maxlength,
  min,
  step,
  rows = 3,             // textarea only
  error = null
}
```

Behavior:

- Idle: label + formatted value + pencil `Button` with `aria-label="Edit {label}"`.
- Editing: shadcn `Input` or `Textarea`, Save and Cancel buttons.
- Enter submits; Escape cancels.
- Real `<form method="POST">`; `use:enhance` is progressive enhancement only.
- Validation uses `Field.Field` `data-invalid` and control `aria-invalid`.
- Long text (`remarks`, `recommendations`) uses `type="textarea"`.
- `ConfirmDelete.svelte` wraps `AlertDialog`; the confirmation button still lives in a real form.

### 6.2 Where inline edit is used

- Patient detail: `fullname`, `birthdate`, `phone`.
- Doctor detail: `fullname`, `birthdate`, `phone`.
- Medication detail: `name`, `method`.
- Procedure detail: `proc_name`, `proc_time`, `remarks`, `recommendations` via `InlineEdit`; text fields use `textarea`.
- Application dosage: `InlineEdit type="number"` inside the applications table.
- TOTP: dedicated `TotpCard`, never `InlineEdit`.

The canonical `/admin/procedures/[id]/edit` page edits all core procedure fields at once and uses `Textarea` for `remarks` and `recommendations`. Both surfaces call the same whitelisted update helper.

### 6.3 Styling

Match `/doc`: shadcn `Card`, `Table`, `Field`, `Button`, `Badge`, `Empty`, `Alert`, `Popover` + `Command` for the medication picker, and destructive `AlertDialog` for deletes. Use Tailwind semantic tokens and `gap-*` layout; no raw terminal colors or `space-x-*`.

## 7. Action contracts

All target IDs are validated from route params. Form values are never trusted as identity or role.

| Page | Action | Inputs | Effect |
|---|---|---|---|
| `/admin/patients/new` | `default` | `oms`, `fullname`, `birthdate`, `phone` | atomic medical + auth create |
| `/admin/patients/[oms]` | `updateField` | `field`, `value` | whitelisted patient field update |
| `/admin/patients/[oms]` | `delete` | — | `admin_delete_patient`; auth row cascades via trigger |
| `/admin/patients/[oms]` | `regenerateTotp` | confirmation | new secret, QR, revoke sessions |
| `/admin/doctors/new` | `default` | `license`, `fullname`, `birthdate`, `phone` | atomic medical + auth create |
| `/admin/doctors/[license]` | `updateField` | `field`, `value` | whitelisted doctor field update |
| `/admin/doctors/[license]` | `delete` | — | `admin_delete_doctor`; auth row cascades |
| `/admin/doctors/[license]` | `regenerateTotp` | confirmation | new secret, QR, revoke sessions |
| `/admin/meds/new` | `default` | `id`, `name`, `method` | `admin_create_medication` |
| `/admin/meds/[id]` | `updateField` | `field`, `value` | whitelisted med field update |
| `/admin/meds/[id]` | `delete` | — | `admin_delete_med` |
| `/admin/procedures` | `delete` | `proc_id` | `admin_delete_proc` |
| `/admin/procedures/[id]` | `updateField` | `field`, `value` | procedure core field update; sets admin login |
| `/admin/procedures/[id]` | `addApplication` | `med_id`, `dosage` | reject duplicate; `doc_create_appl` + touch |
| `/admin/procedures/[id]` | `updateApplication` | `med_id`, `dosage` | `admin_update_appl` + touch |
| `/admin/procedures/[id]` | `deleteApplication` | `med_id` | `admin_delete_appl` + touch |
| `/admin/procedures/[id]` | `deleteProcedure` | — | `admin_delete_proc` |
| `/admin/procedures/[id]/edit` | `default` | `proc_name`, `proc_time`, `remarks`, `recommendations` | `admin_update_proc` with session login |

Field whitelists:

- Patient: `fullname`, `birthdate`, `phone`.
- Doctor: `fullname`, `birthdate`, `phone`.
- Medication: `name`, `method`.
- Procedure: `proc_name`, `proc_time`, `remarks`, `recommendations`.
- Application: `dosage` only.

Unknown `field` values must return `fail(400)`.

### Validation

- OMS/license: `^\d{1,19}$`, BigInt-safe string, ≤ int8 max.
- UUID: standard 8-4-4-4-12 hex form.
- Phone: `^\+7\d{10}$` (also enforced by trigger).
- Names: ≤70 chars; med name ≤50; method ≤30; procedure name ≤200.
- Dates: real `YYYY-MM-DD`; `datetime-local` values interpreted as UTC, like `/doc/new`.
- Dosage: finite number > 0.

### Friendly error mapping

| Postgres | Message shown |
|---|---|
| `23505` | “That OMS/license/UUID already exists.” |
| `23514` | “Phone must be `+7` followed by exactly 10 digits.” |
| `23503` / FK restrict | “Cannot delete: this record is still referenced by procedures/medications.” |
| `P0002` | “Record not found” → `404` on load, `fail(400)` on action |
| `22P02` | “Enter a valid UUID.” |
| `22007` / bad date | “Enter a valid date/time.” |

## 8. TOTP flow details

Create patient/doctor:

1. Generate base32 secret server-side.
2. Atomic create medical row + `AuthUser`.
3. Redirect to the detail page.
4. Detail page shows the handoff card with masked secret and QR.

View:

- Load includes `{ secret, uri, qrDataUrl }` only for the target.
- Secret text is masked until “Reveal” is clicked.
- QR is likewise hidden/blurred until reveal.

Regenerate:

- Confirm via `AlertDialog`.
- New secret replaces old one.
- All sessions for that user are deleted.
- New handoff card data is returned via `form` and displayed immediately.

## 9. Implementation phases

1. SQL: add `search_doctors`, `get_medication`, new `admin_update_proc`, `admin_touch_proc`; rebuild DB with `create_db.sql` then `create_auth.sql`.
2. Add `qrcode` dependency; add auth/TOTP helpers and `admin.js`.
3. Add `/admin/+layout.server.js`, `/admin/+layout.svelte`, dashboard, shared admin components.
4. Medication CRUD.
5. Patient/doctor CRUD + TOTP cards.
6. Procedure list/detail/edit + applications.
7. Verification.

Rebuilding `create_auth.sql` wipes sessions; log in again afterwards.

## 10. Acceptance criteria

- Anonymous `/admin/...` redirects to `/admin/login`; logged-in doctor/patient gets `403`.
- Admin's own credential never appears in page data; target secrets appear only on admin detail pages.
- Created patient/doctor can log in with the displayed TOTP secret.
- Regenerated secret works and old sessions are gone.
- Patient/doctor/med edits work without JS and with JS.
- Patient/doctor/med deletes blocked by FK show friendly messages.
- Procedure patient/doctor cannot be changed from admin UI.
- Procedure edits set `admin_login`; timestamp changes automatically via trigger.
- Application add/edit/remove also update `admin_login`/timestamp.
- Duplicate application add is rejected with a clear message.
- No direct medical DML in app code; no `JOIN`/`WHERE` in app `pool.query` SELECTs.
- `npm run build` and `git diff --check` pass.
