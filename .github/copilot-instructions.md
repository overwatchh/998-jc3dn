# Copilot Project Instructions

Purpose: Enable AI coding agents to work productively in this QR-based academic attendance tracking system (Next.js App Router + MySQL + auth + scheduling + analytics).

## Architecture Overview

- Framework: Next.js 15 App Router (`src/app/**`) with both server (RSC / route handlers) and client components (`"use client"`).
- Data Layer: Direct MySQL access via `mysql2/promise` pool (`src/lib/server/db.ts`). All raw SQL goes through the typed helper `rawQuery<T>(sql, values?)` in `src/lib/server/query.ts` which converts duplicate entry errors to "DUPLICATE_ENTRY".
- Auth: `better-auth` configured in `src/lib/server/auth.ts` (email+password + Google + Microsoft). Session fetched in server contexts via `auth.api.getSession({ headers })`; on client via `/api/auth/me` + React Query.
- State/Data Fetching (client): React Query provider in `src/app/layout.tsx` (`ReactQueryProvider` from `src/lib/queryClient.tsx`). Queries default: stale 5m, retry 1, no refetch on window focus.
- Feature Domains: App directory segments partition roles & access:
  - `(auth)` for public auth pages.
  - `(protected)` root enforces client-side redirect if not logged in (`src/app/(protected)/layout.tsx`).
  - Nested role layouts: `(lecturer)`, `(student)`, `(admin)` gate on server using role check (e.g. lecturer layout redirects if role mismatch).
- API Route Groups: `src/app/api/**` contains REST-ish endpoints with OpenAPI annotations (Swagger UI mounted under `/swagger`). Lecturer & student endpoints separated by path.
- Scheduling: `src/lib/server/init.ts` auto-runs server startup logic (only on server) → initializes lecture end scheduler (`lecture-end-scheduler.ts`) which uses `node-cron` to periodically trigger attendance summary email generation via internal POSTs.
- Email: `emailService` in `src/lib/server/email.ts` builds rich HTML + text attendance summaries; requires SMTP config at runtime (see `EmailConfig`).
- Attendance Logic: `attendance-calculator.ts` computes per-lecture and overall attendance, encoding custom rules (2 scans = 90%, 1 = 45%). Keep rule changes centralized here.
- QR Generation: Large handler at `api/lecturer/study-session/[id]/qr/route.ts` performs validation, date computations (`computeQrDateForWeek`, `parseTimeToDate`), window anchoring, and QR code generation via `qrcode` package.
- Geo Validation: Shared Haversine distance util exists both server (`server/util.ts`) and client (`lib/utils.ts`). Prefer using existing helper instead of re-implementing.

## Key Conventions & Patterns

- Database Access: Always go through `rawQuery<T>` for SQL; prefer explicit column lists; catch `DUPLICATE_ENTRY` for idempotent operations.
- Time & Dates: Use helpers in `lib/utils.ts` (`parseTimeToDate`, `computeQrDateForWeek`, `formatHHMM`). Week/day calculations rely on an anchor QR record if present.
- Role Enforcement: Server route handlers or layouts should enforce roles early and return/redirect before executing expensive logic. Client layouts only handle redirect for anonymous users.
- API Responses: JSON objects with `message`, domain-specific fields, and where collections are returned include a `count` + `data` array (see QR GET example). Follow existing shapes when adding endpoints.
- OpenAPI Annotations: Multi-line JSDoc with `@openapi` tag directly above route handlers. Preserve format when adding new endpoints so they're picked up by Swagger generator.
- React Query Keys: Simple array constants (e.g. `CURRENT_USER_QUERY_KEY = ["currentUser"]`). Invalidate via same array structure after mutations.
- Error Handling: Prefer throwing plain `Error("DUPLICATE_ENTRY")` (converted already) or returning structured error JSON with appropriate status (400/401/403/409). Don’t leak raw SQL errors.
- Styling: Tailwind CSS (v4) + utility helpers (`cn`). Components in `src/components/ui/**` follow shadcn-like patterns (Radix primitives + variant classes); reuse rather than duplicating.
- Client Components: Must start with `"use client"` directive when using hooks, navigation, or browser-only APIs.

## Environment & Config (Non-exhaustive)

Required env vars (inferred): DB_HOST/DB_USER/DB_PASS/DB_NAME (dev), GCP_PROJECT_ID/GCP_REGION/DB_INSTANCE (prod via Cloud SQL socket), GOOGLE_CLIENT_ID/SECRET, MICROSOFT_CLIENT_ID/SECRET, SMTP creds (`smtpHost`, etc.), BASE_URL.

## Developer Workflows

- Install & Dev: `npm install` then `npm run dev` (serves Next.js + server routes). Database must be reachable; initialize with `npm run db:init` (runs `scripts/db-init.sh`).
- Type/Lint Check CI parity: `npm run check` (tsc + eslint). Build: `npm run build`.
- Formatting: `npm run format` (Prettier + import/tailwind sorting plugins). Avoid manual large-scale reordering.
- Swagger Docs: Ensure new/updated route JSDoc matches existing pattern; page at `/swagger` uses `next-swagger-doc` + `swagger-ui-react`.
- Scheduling: If adding new scheduled tasks, register inside `initializeServer()` to guarantee single initialization per server process.

## When Implementing New Features

- Add server logic (SQL + domain rules) under `src/lib/server/*` to keep route handlers thin.
- Reuse attendance calculation functions; if rule changes, update both calculation and email template messaging.
- For new role-restricted UI pages, add them under `(protected)/(role)/` and create/extend the role layout if missing.
- Provide OpenAPI doc block for every new `src/app/api/**/route.ts` file matching style of existing ones (see `auth/me` or QR route for examples).
- Use existing React Query patterns (define key constant, queryFn returning `data`, invalidate key on mutation success).
- For geo or distance checks on client, import `haversineDistance` from `lib/utils.ts`; on server from `server/util.ts`.

## Gotchas

- Do NOT run initialization logic on client—`initializeServer` guard ensures server-only; keep that pattern.
- `auth/api.getSession` requires passing `headers()` from `next/headers`; forgetting this returns null sessions.
- Email service must be initialized before sending; call `emailService.initialize(...)` early in a secure server path.
- Attendance percentages use 90 as full weight per lecture internally; overall percentage divides by total possible (90 \* lectures). Maintain consistency if adjusting weights.
- Cron timezone currently hard-coded (`America/New_York`). Adjust consciously if deploying elsewhere.

## Examples

- Query usage: `const sessions = await rawQuery<{ id: number; name: string }>("SELECT id,name FROM study_session WHERE lecturer_id=?", [lecturerId]);`
- React Query mutation invalidate: `onSuccess: () => queryClient.invalidateQueries({ queryKey: [["currentUser"]] })` (match key structure exactly).
- Role gate (server): `if (session && session.user.role !== Roles.LECTURER) redirect("/dashboard");`

Keep instructions concise. Update this file when adding cross-cutting patterns (new scheduling subsystem, alternative auth flows, etc.).
