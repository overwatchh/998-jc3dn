# AGENTS.md - QR Attendance System

## Build/Lint/Test Commands

- Build: `npm run build` (Next.js build)
- Lint: `npm run lint` (ESLint check)
- Type check: `tsc -p tsconfig.check.json --noEmit`
- Format: `npm run format` (Prettier + import sort)
- Full check: `npm run check` (type + lint)
- Dev: `npm run dev`
- DB init: `npm run db:init`
- No test framework configured; add if needed for single test runs.

## Code Style Guidelines

- **Imports**: Sort with Prettier plugin: core (@core), third-party, server (@server), UI (@ui), relative (./).
- **Formatting**: Prettier: semicolons, double quotes, 2-space tabs, 80-width, ES5 trailing commas, LF end-of-line.
- **Types**: TypeScript strict mode off, no implicit any; use explicit types; paths: @/_ -> ./src/_.
- **Naming**: camelCase for vars/functions, PascalCase for components/types; unused vars prefixed with \_.
- **Error Handling**: Throw plain Error for DUPLICATE_ENTRY; return structured JSON errors (400/401/403/409); no raw SQL leaks.
- **Conventions**: Use rawQuery for DB, role gates on server, React Query keys as arrays, Tailwind + shadcn UI patterns, OpenAPI JSDoc for API routes.

## Copilot Rules

- Enforce roles in server layouts/routes early; use better-auth for sessions; React Query for client state.
- Keep server logic in src/lib/server/\*; thin route handlers; initialize server-only logic in initializeServer().
- Reuse attendance calc functions; geo utils from lib/utils.ts; email service requires SMTP config; cron in America/New_York.
- Add OpenAPI JSDoc for new API routes; follow existing API response shapes with count + data arrays.
