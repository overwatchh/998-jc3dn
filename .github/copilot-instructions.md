# Copilot Instructions for 998-jc3dn

Use this as the source-of-truth guide when proposing code, refactors, or fixes. Keep suggestions aligned with these patterns and workflows.

## Mental model (architecture)

- Next.js 15 App Router in `src/app` with grouped routes: `(auth)`, `(protected)/(student|lecturer|admin)`, and API routes under `src/app/api/**`.
- Auth via `better-auth` backed by MySQL (`mysql2/promise` pool). See `src/lib/server/auth.ts` and `src/lib/server/db.ts`.
- Database access uses a light wrapper `rawQuery<T>(sql, values?)` in `src/lib/server/query.ts` (generic typing for SELECT vs INSERT/UPDATE). It maps `ER_DUP_ENTRY` to `Error("DUPLICATE_ENTRY")`.
- Client/server communication:
  - API: Next.js route handlers export HTTP methods (GET/POST/PUT…). Responses use `NextResponse.json({ message, ... }, { status })`.
  - Client: Axios instance `src/lib/api/apiClient.ts` (baseURL `/api`, `withCredentials: true`). Data fetching/mutations via TanStack Query with `queryClient` from `src/lib/queryClient.tsx`.
- Documentation: OpenAPI via `next-swagger-doc` scanning `src/app/api/**`. UI at `/swagger` (`src/app/swagger/page.tsx`). Server URL driven by `BASE_URL` (dev) or a fixed prod URL.
- UI: shadcn/ui components in `src/components/ui/**`; icons via `lucide-react`. State: TanStack Query; global/store libs (like Zustand) not wired yet.

## Dev workflows (npm scripts)

- Start dev: `npm run dev` (Turbopack)
- Build/Start: `npm run build` / `npm run start`
- Lint/Format/Typecheck: `npm run lint` · `npm run format` · `npm run check` (tsc + ESLint)
- Clean: `npm run clean`
- Initialize local DB (MySQL/MariaDB client required): `npm run db:init` (runs `scripts/db-init.sh` against env-configured server)

## Conventions and patterns

- Imports use `@/` alias for `src/`. Group imports: React → third-party → internal modules.
- Use Zod schemas from `src/types/**` to validate API payloads (example: `types/qr-code.ts`). Derive TS types via `z.infer`.
- Authenticate inside API handlers with `auth.api.getSession({ headers: await headers() })`. Enforce roles (`student`, `lecturer`, …) explicitly.
- DB queries are parameterized via `rawQuery` and typed per-row. Prefer single-purpose SQL near handlers; avoid ORMs.
- Error handling: return consistent JSON with `message` and appropriate HTTP codes. Don’t leak internals; map DB errors (e.g., `DUPLICATE_ENTRY`).
- React Query: mutations should `invalidateQueries` for affected keys (see hooks in `src/hooks/**`). Disable aggressive refetch-on-focus by default (see `queryClient.tsx`).
- Axios client already sets `withCredentials: true` for cookie auth—do not override casually.

## Key feature flows (ground truth examples)

- Lecturer generates QR: `POST /api/lecturer/study-session/[id]/qr` uses Zod to validate `{ week_number, valid_room_id, validate_geo, radius, validities[2] }`, checks lecturer-session assignment, builds validity windows, and generates a QR image (via `qrcode`).
- Student check-in: `POST /api/student/attendance/checkin` verifies enrolment/assignment, current validity window, optional geofence via `haversineDistance` in `src/lib/server/util.ts`, prevents duplicates per-window, and inserts `checkin`.
- Common QR info: `GET /api/qr/{qr_code_id}` returns validity windows, active window, and room/geofence info.

## Minimal API route template (follow this style)

```ts
import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  /* fields */
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "lecturer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }
    // const rows = await rawQuery<RowType>("SELECT ... WHERE id = ?", [id]);
    return NextResponse.json({ message: "OK" });
  } catch (err) {
    if ((err as Error).message === "DUPLICATE_ENTRY") {
      return NextResponse.json({ message: "Conflict" }, { status: 409 });
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

## Environment and configuration (must-know)

- Dev DB: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`.
- Prod DB (Cloud SQL): `GCP_PROJECT_ID`, `GCP_REGION`, `DB_INSTANCE`, plus `DB_USER`, `DB_PASS`, `DB_NAME`.
- Auth providers: `GOOGLE_CLIENT_ID/SECRET`, `MICROSOFT_CLIENT_ID/SECRET` (see `auth.ts`).
- App base URL: `BASE_URL` used by Swagger/OpenAPI.

## When adding new code

- API routes: colocate under `src/app/api/<feature>/route.ts`, add JSDoc OpenAPI like existing endpoints to surface in `/swagger`.
- Data access: prefer `rawQuery` with typed row shapes; always parameterize values.
- Client hooks: follow patterns in `src/hooks/**`—wrap Axios calls, return `useQuery`/`useMutation`, and invalidate relevant query keys.
- Keep responses consistent with `message` and well-chosen HTTP status.

If anything here is unclear or missing (e.g., env values for your setup, additional domain types), tell me and I’ll refine this doc.
