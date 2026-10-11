# Admin Workspace

This guide describes the admin workspace currently implemented in e-Mate AI, including its routes, access rules, persisted controls, and setup requirements.

## Pages

The admin navigation is split into focused pages:

| Page | Route | What it shows or controls |
|---|---|---|
| Overview | `/admin` | Workspace metrics and status summary |
| Activity | `/admin/activity` | Recent chat and notebook activity |
| Users | `/admin/users` | Recent user profiles |
| System health | `/admin/system-health` | Database and service health indicators |
| Model routing | `/admin/model-routing` | The model used by e-Mate and model availability |
| Feature controls | `/admin/feature-controls` | Runtime feature flags |

The pages share the admin navigation and dashboard components while each route selects its own section. Unknown section routes return to `/admin`.

## Access

- In local development, the admin page and admin API allow access without an admin allowlist.
- In production, page access requires a signed-in user whose email is listed in `ADMIN_EMAILS` (comma-separated).
- The admin API additionally accepts `ADMIN_API_KEY` through the `x-admin-key` request header. This API-key path does not grant access to the admin page itself.
- Production access fails closed when the required auth configuration is absent or the user is not allowed.

Example server-side environment configuration:

```env
ADMIN_EMAILS=admin@example.com
# Optional for direct API clients; keep the value secret.
ADMIN_API_KEY=replace_with_a_long_random_value
```

## Persisted settings setup

Feature flags and model configuration are stored in the `public.admin_settings` table. Apply this migration to the Supabase project before expecting admin setting changes to persist:

```text
supabase/migrations/20261011000000_admin_settings.sql
```

Configure these server environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_server_only_service_role_key
```

The migration enables row-level security, removes access for `public`, `anon`, and `authenticated`, and grants table access only to `service_role`. The service role key must remain on the server: do not add a `NEXT_PUBLIC_` prefix, place it in client code, or commit it. If the URL/key or table is unavailable, the admin API returns defaults and reports settings storage as unavailable; settings cannot be saved.

## Feature controls

| Control | Effect |
|---|---|
| Maintenance mode | Blocks chat requests and returns the maintenance response. |
| Referral program | Controls whether invite routes accept/show referral functionality. |
| OpenRouter model selector | Hides model selection in the composer and forces chat requests to use the configured e-Mate model. |
| Study mode | Hides/disables study mode in the chat workspace. |
| Experimental AI models | Includes or excludes experimental models from the user-facing model list. |

Changes are fetched from the no-store `/api/runtime-config` route so clients receive current settings. Model discovery also uses the live OpenRouter models endpoint with the configured model allowlist and a static fallback.

## Model routing

The model routing page can select the active backing model for e-Mate and enable/disable curated model IDs. The default e-Mate engine is `google/gemini-2.0-flash:free`. The API validates model IDs against the curated free-model catalog before saving. The active engine and enabled model IDs are stored under the `model_config` settings key.

## Admin API summary

`/api/admin` exposes read actions for overview, users, activity, recent users, referrals, credits, health, feature flags, model configuration, and aggregate stats. POST actions support health ping, feature-flag updates, model-config updates, and active-model changes. Requests are authorized server-side; write actions require the settings table and service-role storage to be configured.

## Current implementation notes

- Admin list and metric queries are defensive: unavailable tables or query errors can result in empty lists or zero counts. Treat those values as unavailable data until system health confirms the database connection, rather than as authoritative zero usage.
- Guest users, referral totals, and health issue counts are currently returned as zero in overview metrics; they are not backed by stored aggregates yet.
- The admin API's API-key authorization applies to API requests only. For the web page in production, configure `ADMIN_EMAILS` and Supabase Auth.
